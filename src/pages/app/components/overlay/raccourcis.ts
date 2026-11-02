import { getShortcutsConfig, formatShortcutKeyForDisplay } from "@/lib";

// Libelle lisible du raccourci d'une action (ex. "Ctrl + \"), ou null s'il est desactive.
export function raccourci(actionId: string): string | null {
  try {
    const binding = getShortcutsConfig().bindings[actionId];
    if (!binding || !binding.enabled || !binding.key) return null;
    return formatShortcutKeyForDisplay(binding.key)
      .replace(/Backslash/gi, "\\")
      .replace(/Slash/gi, "/");
  } catch {
    return null;
  }
}
