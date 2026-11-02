//! Lecture des fichiers choisis par l'utilisateur (boite de dialogue native ou glisser-deposer).
//! Les octets sont renvoyes bruts a l'interface, sans passer par un champ <input type="file">.

use std::path::Path;

const TAILLE_MAX: u64 = 60 * 1024 * 1024; // 60 Mo

#[tauri::command]
pub async fn lire_fichier(chemin: String) -> Result<tauri::ipc::Response, String> {
    let chemin = Path::new(&chemin);
    let meta = std::fs::metadata(chemin).map_err(|e| format!("Fichier introuvable : {}", e))?;
    if !meta.is_file() {
        return Err("Ce n'est pas un fichier".to_string());
    }
    if meta.len() > TAILLE_MAX {
        return Err("Fichier trop volumineux (60 Mo maximum)".to_string());
    }
    let octets = tokio::fs::read(chemin)
        .await
        .map_err(|e| format!("Lecture impossible : {}", e))?;
    Ok(tauri::ipc::Response::new(octets))
}
