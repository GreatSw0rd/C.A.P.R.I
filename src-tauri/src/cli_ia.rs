//! Fournisseurs « IA via CLI locale » (gratuits) : utilisent un outil en ligne de commande déjà
//! installé et connecté sur la machine (Claude Code, Gemini CLI, OpenAI Codex, Qwen Code) comme
//! moteur d'IA, au lieu d'une API payante.
//!
//! Prérequis : l'outil choisi doit être installé et connecté (disponible dans le PATH).
//! Les images (captures, fichiers joints) sont écrites dans un dossier temporaire qui devient le
//! dossier de travail de la CLI, puis désignées dans le prompt (ou via `-i` pour Codex).
//!
//! Sous Windows, les CLI installées via npm sont des scripts `.cmd` que `CreateProcess` ne peut
//! pas lancer directement : on passe donc par `cmd /C <outil>` (qui résout aussi l'extension via
//! PATHEXT) et on masque la fenêtre console. Le prompt est envoyé par l'entrée standard pour
//! éviter tout problème d'échappement de caractères spéciaux.

use base64::Engine;
use std::path::PathBuf;
use std::process::Stdio;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;

/// Description de l'invocation d'un outil CLI.
struct OutilCli {
    /// Nom de base du binaire (sans extension ; `cmd /C` résout `.cmd`/`.exe` sous Windows).
    base: &'static str,
    /// Sous-commande éventuelle (ex. `codex exec`).
    sous_commande: Option<&'static str>,
    /// Drapeau « print » à ajouter (ex. `-p` pour Claude Code).
    drapeau_print: Option<&'static str>,
    /// Drapeau de sélection du modèle (ex. `--model` ou `-m`).
    drapeau_modele: &'static str,
}

fn config(outil: &str) -> Option<OutilCli> {
    match outil {
        "claude" => Some(OutilCli {
            base: "claude",
            sous_commande: None,
            drapeau_print: Some("-p"),
            drapeau_modele: "--model",
        }),
        "gemini" => Some(OutilCli {
            base: "gemini",
            sous_commande: None,
            drapeau_print: None,
            drapeau_modele: "-m",
        }),
        "codex" => Some(OutilCli {
            base: "codex",
            sous_commande: Some("exec"),
            drapeau_print: None,
            drapeau_modele: "-m",
        }),
        "qwen" => Some(OutilCli {
            base: "qwen",
            sous_commande: None,
            drapeau_print: None,
            drapeau_modele: "-m",
        }),
        _ => None,
    }
}

/// Fusionne la consigne système dans le texte envoyé à la CLI (évite de dépendre d'un drapeau
/// `--system-prompt` dont le nom varie).
fn construire_prompt(system_prompt: Option<&str>, message: &str) -> String {
    match system_prompt {
        Some(s) if !s.trim().is_empty() => format!("{}\n\n{}", s.trim(), message),
        _ => message.to_string(),
    }
}

/// Extension d'image d'après les premiers octets (PNG par défaut).
fn extension_image(octets: &[u8]) -> &'static str {
    if octets.starts_with(&[0xFF, 0xD8]) {
        "jpg"
    } else if octets.starts_with(b"GIF8") {
        "gif"
    } else if octets.len() > 12 && &octets[0..4] == b"RIFF" && &octets[8..12] == b"WEBP" {
        "webp"
    } else {
        "png"
    }
}

/// Écrit les images (base64, avec ou sans préfixe data:) dans un dossier temporaire.
fn ecrire_images(images: &[String]) -> Result<(PathBuf, Vec<String>), String> {
    let dossier = std::env::temp_dir()
        .join("capri-images")
        .join(uuid::Uuid::new_v4().to_string());
    std::fs::create_dir_all(&dossier).map_err(|e| format!("Dossier temporaire : {}", e))?;
    let mut noms = Vec::new();
    for (i, img) in images.iter().enumerate() {
        let brut = img.split_once("base64,").map(|(_, b)| b).unwrap_or(img);
        let octets = base64::engine::general_purpose::STANDARD
            .decode(brut.trim())
            .map_err(|e| format!("Image illisible : {}", e))?;
        let nom = format!("image-{}.{}", i + 1, extension_image(&octets));
        std::fs::write(dossier.join(&nom), &octets)
            .map_err(|e| format!("Écriture de l'image : {}", e))?;
        noms.push(nom);
    }
    Ok((dossier, noms))
}

/// Phrase ajoutée au prompt pour désigner les images à la CLI.
fn mention_images(outil: &str, noms: &[String]) -> String {
    match outil {
        // Gemini CLI et Qwen Code chargent les fichiers cités avec @.
        "gemini" | "qwen" => format!(
            "Images jointes : {}",
            noms.iter().map(|n| format!("@{}", n)).collect::<Vec<_>>().join(" ")
        ),
        // Codex reçoit les images par l'option -i.
        "codex" => "Analyse aussi les images jointes.".to_string(),
        _ => format!(
            "Images jointes dans le dossier courant, à lire et analyser avant de répondre : {}",
            noms.join(", ")
        ),
    }
}

/// Prépare la commande selon la plateforme (passe par `cmd /C` sous Windows).
fn construire_commande(base: &str, args: &[String]) -> Command {
    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let mut cmd = Command::new("cmd");
        cmd.arg("/C").arg(base);
        for a in args {
            cmd.arg(a);
        }
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd
    }
    #[cfg(not(windows))]
    {
        let mut cmd = Command::new(base);
        for a in args {
            cmd.arg(a);
        }
        cmd
    }
}

fn message_absence(base: &str) -> String {
    format!(
        "Binaire `{}` introuvable ou non reconnu. Installez l'outil, connectez-vous, puis réessayez.",
        base
    )
}

/// Indique si l'outil CLI demandé répond (le binaire existe et `--version` réussit).
#[tauri::command]
pub async fn cli_disponible(outil: String) -> bool {
    let Some(cfg) = config(&outil) else {
        return false;
    };
    let mut cmd = construire_commande(cfg.base, &["--version".to_string()]);
    cmd.stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    cmd.output()
        .await
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Envoie un message à l'outil CLI demandé en mode « print » et renvoie la réponse texte.
#[tauri::command]
pub async fn cli_chat(
    outil: String,
    message: String,
    system_prompt: Option<String>,
    modele: Option<String>,
    images: Option<Vec<String>>,
) -> Result<String, String> {
    let Some(cfg) = config(&outil) else {
        return Err(format!("Outil CLI inconnu : {}", outil));
    };
    let images = images.unwrap_or_default();
    let (dossier_images, noms_images) = if images.is_empty() {
        (None, Vec::new())
    } else {
        let (d, n) = ecrire_images(&images)?;
        (Some(d), n)
    };
    let mut prompt = construire_prompt(system_prompt.as_deref(), &message);
    if !noms_images.is_empty() {
        prompt = format!("{}\n\n{}", prompt, mention_images(&outil, &noms_images));
    }

    // Construit les arguments (le prompt passe par l'entrée standard, pas en argument).
    let mut args: Vec<String> = Vec::new();
    if let Some(sc) = cfg.sous_commande {
        args.push(sc.to_string());
    }
    if let Some(flag) = cfg.drapeau_print {
        args.push(flag.to_string());
    }
    if let Some(m) = modele.as_deref() {
        if !m.trim().is_empty() {
            args.push(cfg.drapeau_modele.to_string());
            args.push(m.trim().to_string());
        }
    }
    if outil == "codex" {
        for n in &noms_images {
            args.push("-i".to_string());
            args.push(n.clone());
        }
    }

    let mut cmd = construire_commande(cfg.base, &args);
    if let Some(d) = &dossier_images {
        cmd.current_dir(d);
    }
    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // La CLI est tuee si on abandonne l'attente (delai depasse).
    cmd.kill_on_drop(true);
    let nettoyer = |d: &Option<PathBuf>| {
        if let Some(d) = d {
            let _ = std::fs::remove_dir_all(d);
        }
    };

    let mut enfant = match cmd.spawn() {
        Ok(c) => c,
        Err(_) => {
            nettoyer(&dossier_images);
            return Err(message_absence(cfg.base));
        }
    };

    // Écrit le prompt sur l'entrée standard, puis la ferme pour signaler la fin.
    if let Some(mut entree) = enfant.stdin.take() {
        if entree.write_all(prompt.as_bytes()).await.is_err() {
            nettoyer(&dossier_images);
            return Err("Impossible d'envoyer le prompt à la CLI.".into());
        }
        let _ = entree.shutdown().await;
    }

    // Delai maximal : evite une attente infinie si la CLI reste bloquee.
    let sortie =
        tokio::time::timeout(std::time::Duration::from_secs(240), enfant.wait_with_output()).await;
    nettoyer(&dossier_images);
    let sortie = match sortie {
        Err(_) => {
            return Err(format!(
                "La CLI `{}` n'a pas répondu en 4 minutes. Vérifiez qu'elle est bien connectée.",
                outil
            ))
        }
        Ok(Err(e)) => return Err(format!("Échec de la CLI : {}", e)),
        Ok(Ok(s)) => s,
    };

    if sortie.status.success() {
        let texte = String::from_utf8_lossy(&sortie.stdout).trim().to_string();
        if texte.is_empty() {
            return Err("Réponse vide de la CLI.".into());
        }
        return Ok(texte);
    }

    let err = String::from_utf8_lossy(&sortie.stderr).trim().to_string();
    let err_bas = err.to_lowercase();
    // Sous Windows, un binaire absent renvoie « n'est pas reconnu » / « not recognized ».
    if err_bas.contains("not recognized")
        || err_bas.contains("n'est pas reconnu")
        || err_bas.contains("introuvable")
        || err_bas.contains("not found")
    {
        return Err(message_absence(cfg.base));
    }
    Err(if err.is_empty() {
        format!("La CLI `{}` a échoué (code {:?}).", outil, sortie.status.code())
    } else {
        err
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    // Les tests modifient PATH : on les execute l'un apres l'autre.
    static VERROU: Mutex<()> = Mutex::new(());

    /// Cree un faux binaire `claude` qui renvoie le prompt recu et la liste des fichiers du
    /// dossier courant (ou qui dort, pour tester le delai).
    #[cfg(unix)]
    fn faux_claude(script: &str) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let dossier = std::env::temp_dir().join(format!("capri-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dossier).unwrap();
        let bin = dossier.join("claude");
        std::fs::write(&bin, format!("#!/bin/sh\n{}\n", script)).unwrap();
        std::fs::set_permissions(&bin, std::fs::Permissions::from_mode(0o755)).unwrap();
        dossier
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn transmet_prompt_modele_et_images() {
        let _g = VERROU.lock().unwrap();
        let dossier = faux_claude(r#"echo "ARGS:$*"; echo "FICHIERS:$(ls)"; cat"#);
        let ancien = std::env::var("PATH").unwrap_or_default();
        std::env::set_var("PATH", format!("{}:{}", dossier.display(), ancien));

        let png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        let res = cli_chat(
            "claude".into(),
            "Bonjour".into(),
            Some("Consigne".into()),
            Some("sonnet".into()),
            Some(vec![format!("data:image/png;base64,{}", png)]),
        )
        .await;
        std::env::set_var("PATH", ancien);
        let texte = res.expect("la CLI doit repondre");
        assert!(texte.contains("ARGS:-p --model sonnet"), "{}", texte);
        assert!(texte.contains("FICHIERS:image-1.png"), "{}", texte);
        assert!(texte.contains("Consigne"), "{}", texte);
        assert!(texte.contains("Bonjour"), "{}", texte);
        assert!(texte.contains("image-1.png"), "{}", texte);
    }

    #[cfg(unix)]
    #[tokio::test]
    async fn outil_absent_message_clair() {
        let _g = VERROU.lock().unwrap();
        let ancien = std::env::var("PATH").unwrap_or_default();
        std::env::set_var("PATH", "/nonexistent");
        let res = cli_chat("claude".into(), "x".into(), None, None, None).await;
        std::env::set_var("PATH", ancien);
        let err = res.expect_err("doit echouer");
        assert!(err.to_lowercase().contains("claude"), "{}", err);
    }

    #[test]
    fn extension_detectee() {
        assert_eq!(extension_image(&[0xFF, 0xD8, 0xFF]), "jpg");
        assert_eq!(extension_image(b"GIF89a"), "gif");
        assert_eq!(extension_image(&[0x89, b'P', b'N', b'G']), "png");
    }
}
