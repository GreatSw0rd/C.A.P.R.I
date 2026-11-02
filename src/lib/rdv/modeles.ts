import { safeLocalStorage } from "../storage";
import { STORAGE_KEYS } from "@/config";
import type { TYPE_PROVIDER } from "@/types";

// Choix du modele selon l'usage : pendant l'appel, la vitesse compte (ex. Groq) ;
// pour la preparation et le compte-rendu, la qualite compte (ex. Claude CLI).
export type UsageIA = "direct" | "synthese";

const CLE: Record<UsageIA, string> = {
  direct: STORAGE_KEYS.RDV_MODELE_DIRECT,
  synthese: STORAGE_KEYS.RDV_MODELE_SYNTHESE,
};

export function lireModeleUsage(usage: UsageIA): string {
  return safeLocalStorage.getItem(CLE[usage]) || "";
}

export function definirModeleUsage(usage: UsageIA, idFournisseur: string) {
  if (idFournisseur) safeLocalStorage.setItem(CLE[usage], idFournisseur);
  else safeLocalStorage.removeItem(CLE[usage]);
}

/**
 * Fournisseur a utiliser pour un usage : celui choisi pour cet usage (avec ses variables
 * memorisees), sinon le fournisseur actif.
 */
export function fournisseurPourUsage(
  usage: UsageIA,
  tous: TYPE_PROVIDER[],
  actif: { provider: string; variables: Record<string, string> }
): { provider: TYPE_PROVIDER | undefined; selectedProvider: { provider: string; variables: Record<string, string> } } {
  const id = lireModeleUsage(usage);
  if (id && id !== actif.provider) {
    const p = tous.find((x) => x.id === id);
    if (p) {
      let variables: Record<string, string> = {};
      try {
        const map = JSON.parse(safeLocalStorage.getItem(STORAGE_KEYS.PROVIDER_VARIABLES) || "{}");
        variables = map[id] || {};
      } catch {
        variables = {};
      }
      return { provider: p, selectedProvider: { provider: id, variables } };
    }
  }
  return { provider: tous.find((x) => x.id === actif.provider), selectedProvider: actif };
}
