import { STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "./storage";

// Tailles de l'overlay (hauteur de la fenetre), facon chat classique.
export type OverlaySize = "S" | "M" | "L" | "XL" | "Full";

export const OVERLAY_SIZES: OverlaySize[] = ["S", "M", "L", "XL", "Full"];

const HAUTEURS: Record<Exclude<OverlaySize, "Full">, number> = {
  S: 420,
  M: 560,
  L: 700,
  XL: 860,
};

export function getOverlaySize(): OverlaySize {
  const v = safeLocalStorage.getItem(STORAGE_KEYS.OVERLAY_SIZE) as OverlaySize | null;
  return v && OVERLAY_SIZES.includes(v) ? v : "M";
}

export function setOverlaySizeStored(size: OverlaySize): void {
  safeLocalStorage.setItem(STORAGE_KEYS.OVERLAY_SIZE, size);
}

export function overlayHeightFor(size: OverlaySize): number {
  if (size === "Full") {
    const dispo =
      typeof window !== "undefined" && window.screen?.availHeight
        ? window.screen.availHeight - 80
        : 900;
    return Math.max(500, dispo);
  }
  return HAUTEURS[size];
}

export function getOverlayHeight(): number {
  return overlayHeightFor(getOverlaySize());
}
