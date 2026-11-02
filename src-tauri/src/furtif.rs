//! Mode furtif : exclut les fenêtres de Souffleur des captures et partages d'écran, et masque
//! l'icône de la barre des tâches.
//!
//! Projet pédagogique, pour comprendre le mécanisme : il est verrouillé par un mot de passe
//! (haché avec Argon2), désactivé à chaque démarrage, et doit être retiré avant toute publication.
//!
//! Le mécanisme lui-même tient en un appel au système, exposé par Tauri : `set_content_protected`.
//! - Windows : `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)` ; la fenêtre reste visible
//!   à l'écran mais apparaît vide dans les captures, partages d'écran et enregistrements.
//! - macOS : `NSWindow.sharingType = .none`.
//! - Linux : non pris en charge, la protection n'a aucun effet.
//! Ce n'est pas une garantie : un appareil photo, une carte d'acquisition ou un logiciel de
//! surveillance d'examen voient ou détectent quand même la fenêtre.

use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};

use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, Runtime, State};

const FICHIER: &str = "furtif.json";
const LONGUEUR_MIN: usize = 8;

#[derive(Default)]
pub struct EtatFurtif {
    deverrouille: AtomicBool,
    actif: AtomicBool,
}

impl EtatFurtif {
    pub fn est_deverrouille(&self) -> bool {
        self.deverrouille.load(Ordering::SeqCst)
    }

    pub fn est_actif(&self) -> bool {
        self.actif.load(Ordering::SeqCst)
    }
}

#[derive(Serialize, Deserialize)]
struct Empreinte {
    empreinte: String,
}

#[derive(Serialize, Clone)]
pub struct StatutFurtif {
    configure: bool,
    deverrouille: bool,
    actif: bool,
}

fn chemin<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    let dossier = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Dossier de données introuvable : {}", e))?;
    fs::create_dir_all(&dossier).map_err(|e| format!("Création du dossier impossible : {}", e))?;
    Ok(dossier.join(FICHIER))
}

fn lire_empreinte<R: Runtime>(app: &AppHandle<R>) -> Result<Option<String>, String> {
    let fichier = chemin(app)?;
    if !fichier.exists() {
        return Ok(None);
    }
    let contenu = fs::read_to_string(&fichier).map_err(|e| format!("Lecture impossible : {}", e))?;
    let empreinte: Empreinte =
        serde_json::from_str(&contenu).map_err(|e| format!("Fichier furtif illisible : {}", e))?;
    Ok(Some(empreinte.empreinte))
}

fn statut<R: Runtime>(app: &AppHandle<R>, etat: &EtatFurtif) -> StatutFurtif {
    StatutFurtif {
        configure: matches!(lire_empreinte(app), Ok(Some(_))),
        deverrouille: etat.est_deverrouille(),
        actif: etat.est_actif(),
    }
}

/// Applique la protection à toutes les fenêtres ouvertes et prévient l'interface.
fn appliquer<R: Runtime>(app: &AppHandle<R>, etat: &EtatFurtif, actif: bool) -> Result<(), String> {
    for fenetre in app.webview_windows().values() {
        fenetre
            .set_content_protected(actif)
            .map_err(|e| format!("Protection de la fenêtre impossible : {}", e))?;
        fenetre
            .set_skip_taskbar(actif)
            .map_err(|e| format!("Réglage de la barre des tâches impossible : {}", e))?;
    }
    etat.actif.store(actif, Ordering::SeqCst);
    let _ = app.emit("furtif-change", statut(app, etat));
    Ok(())
}

#[tauri::command]
pub fn statut_furtif<R: Runtime>(app: AppHandle<R>, etat: State<'_, EtatFurtif>) -> StatutFurtif {
    statut(&app, &etat)
}

#[tauri::command]
pub fn definir_mot_de_passe_furtif<R: Runtime>(app: AppHandle<R>, mot_de_passe: String) -> Result<(), String> {
    if lire_empreinte(&app)?.is_some() {
        return Err("Un mot de passe existe déjà.".into());
    }
    if mot_de_passe.chars().count() < LONGUEUR_MIN {
        return Err(format!("Le mot de passe doit compter au moins {} caractères.", LONGUEUR_MIN));
    }
    let sel = SaltString::generate(&mut OsRng);
    let empreinte = Argon2::default()
        .hash_password(mot_de_passe.as_bytes(), &sel)
        .map_err(|e| format!("Hachage impossible : {}", e))?
        .to_string();
    let contenu = serde_json::to_string(&Empreinte { empreinte }).map_err(|e| e.to_string())?;
    fs::write(chemin(&app)?, contenu).map_err(|e| format!("Enregistrement impossible : {}", e))
}

#[tauri::command]
pub fn deverrouiller_furtif<R: Runtime>(
    app: AppHandle<R>,
    etat: State<'_, EtatFurtif>,
    mot_de_passe: String,
) -> Result<bool, String> {
    let Some(empreinte) = lire_empreinte(&app)? else {
        return Err("Aucun mot de passe défini.".into());
    };
    let analyse = PasswordHash::new(&empreinte).map_err(|e| format!("Empreinte invalide : {}", e))?;
    let valide = Argon2::default()
        .verify_password(mot_de_passe.as_bytes(), &analyse)
        .is_ok();
    etat.deverrouille.store(valide, Ordering::SeqCst);
    let _ = app.emit("furtif-change", statut(&app, &etat));
    Ok(valide)
}

#[tauri::command]
pub fn verrouiller_furtif<R: Runtime>(app: AppHandle<R>, etat: State<'_, EtatFurtif>) -> Result<(), String> {
    appliquer(&app, &etat, false)?;
    etat.deverrouille.store(false, Ordering::SeqCst);
    let _ = app.emit("furtif-change", statut(&app, &etat));
    Ok(())
}

#[tauri::command]
pub fn activer_furtif<R: Runtime>(
    app: AppHandle<R>,
    etat: State<'_, EtatFurtif>,
    actif: bool,
) -> Result<StatutFurtif, String> {
    if actif && !etat.est_deverrouille() {
        return Err("Mode furtif verrouillé : saisissez le mot de passe.".into());
    }
    appliquer(&app, &etat, actif)?;
    Ok(statut(&app, &etat))
}
