import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";

/**
 * Ouvre le tableau de bord, et l'amene sur une page precise si `chemin` est fourni
 * (ex. "/knowledge", "/chats", "/settings", "/dev-space").
 */
export async function ouvrirTableauDeBord(chemin?: string): Promise<void> {
  try {
    await invoke("open_dashboard");
    if (chemin) {
      await emit("dashboard-navigate", chemin);
    }
  } catch (error) {
    console.error("Failed to open dashboard:", error);
  }
}

// Affiche l'overlay depuis le tableau de bord, avec une action facultative :
// "ecouter" demarre l'ecoute, "demander" envoie le texte comme question.
export async function ouvrirOverlay(
  action?: "ecouter" | "demander",
  texte?: string
): Promise<void> {
  await invoke("afficher_overlay", { action: action ?? null, texte: texte ?? null });
}
