import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "@/lib";

// Niveau des effets visuels du tableau de bord :
// complet = fonds animes (WebGL) et effets, leger = motifs statiques, aucun = fond uni.
export type NiveauEffets = "complet" | "leger" | "aucun";

const EVENEMENT = "souffleur-effets";

export function lireNiveauEffets(): NiveauEffets {
  const v = safeLocalStorage.getItem(STORAGE_KEYS.VISUAL_EFFECTS);
  if (v === "complet" || v === "leger" || v === "aucun") return v;
  // Sans choix explicite, on respecte la preference systeme "reduire les animations".
  const reduit =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return reduit ? "leger" : "complet";
}

export function definirNiveauEffets(niveau: NiveauEffets) {
  safeLocalStorage.setItem(STORAGE_KEYS.VISUAL_EFFECTS, niveau);
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: niveau }));
}

export function useEffetsVisuels(): [NiveauEffets, (n: NiveauEffets) => void] {
  const [niveau, setNiveau] = useState<NiveauEffets>(lireNiveauEffets);

  useEffect(() => {
    const maj = () => setNiveau(lireNiveauEffets());
    const surStockage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.VISUAL_EFFECTS) maj();
    };
    window.addEventListener(EVENEMENT, maj);
    window.addEventListener("storage", surStockage);
    return () => {
      window.removeEventListener(EVENEMENT, maj);
      window.removeEventListener("storage", surStockage);
    };
  }, []);

  return [niveau, definirNiveauEffets];
}

// Vrai quand le theme sombre est applique (classe "dark" sur <html>).
export function useThemeSombre(): boolean {
  const lire = () => document.documentElement.classList.contains("dark");
  const [sombre, setSombre] = useState<boolean>(lire);

  useEffect(() => {
    const obs = new MutationObserver(() => setSombre(lire()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  return sombre;
}
