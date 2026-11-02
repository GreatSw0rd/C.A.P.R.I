import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";

// Choix et lecture de fichiers via Tauri (boite de dialogue native et glisser-deposer).
// On n'utilise pas <input type="file"> : sous Windows sa fenetre peut s'ouvrir cachee
// derriere l'overlay (toujours au premier plan) et bloquer toute l'application.

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
};

export const EXTENSIONS_DOCUMENTS = ["pdf", "docx", "txt", "md", "csv", "json"];
export const EXTENSIONS_IMAGES = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];

const nomDe = (chemin: string) => chemin.split(/[\\/]/).pop() || chemin;
const extensionDe = (nom: string) => (nom.split(".").pop() || "").toLowerCase();

/** Lit des fichiers a partir de leurs chemins (renvoyes par la boite de dialogue ou un depot). */
export async function fichiersDepuisChemins(chemins: string[]): Promise<File[]> {
  const fichiers: File[] = [];
  for (const chemin of chemins) {
    const octets = await invoke<ArrayBuffer>("lire_fichier", { chemin });
    const nom = nomDe(chemin);
    fichiers.push(
      new File([octets], nom, {
        type: TYPES[extensionDe(nom)] || "application/octet-stream",
      })
    );
  }
  return fichiers;
}

/** Ouvre la boite de dialogue native et renvoie les fichiers choisis (vide si annule). */
export async function choisirFichiers(options: {
  extensions: string[];
  libelle: string;
  multiple?: boolean;
}): Promise<File[]> {
  const choix = await open({
    multiple: options.multiple ?? true,
    directory: false,
    filters: [{ name: options.libelle, extensions: options.extensions }],
  });
  if (!choix) return [];
  const chemins = Array.isArray(choix) ? choix : [choix];
  return fichiersDepuisChemins(chemins);
}

/** Ne garde que les fichiers dont l'extension est autorisee. */
export function filtrerParExtension(chemins: string[], extensions: string[]) {
  return chemins.filter((c) => extensions.includes(extensionDe(nomDe(c))));
}

/**
 * Glisser-deposer de fichiers sur la fenetre (gere par Tauri, qui fournit les chemins).
 * Renvoie vrai pendant le survol, pour afficher la zone de depot.
 */
export function useDepotFichiers(
  extensions: string[],
  surDepot: (fichiers: File[]) => void,
  actif = true
): boolean {
  const [survol, setSurvol] = useState(false);
  const rappel = useRef(surDepot);
  rappel.current = surDepot;

  useEffect(() => {
    if (!actif) return;
    let fini = false;
    let retirer: (() => void) | null = null;
    getCurrentWebview()
      .onDragDropEvent(async (event) => {
        const p = event.payload;
        if (p.type === "enter" || p.type === "over") {
          setSurvol(true);
        } else if (p.type === "leave") {
          setSurvol(false);
        } else if (p.type === "drop") {
          setSurvol(false);
          const chemins = filtrerParExtension(p.paths, extensions);
          if (chemins.length === 0) return;
          try {
            rappel.current(await fichiersDepuisChemins(chemins));
          } catch (e) {
            console.error("Depot de fichiers impossible :", e);
          }
        }
      })
      .then((fn) => {
        if (fini) fn();
        else retirer = fn;
      })
      .catch(() => {});
    return () => {
      fini = true;
      retirer?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, extensions.join(",")]);

  return survol;
}

/**
 * Pour les composants existants qui attendent un evenement de champ fichier :
 * ouvre la boite de dialogue d'images et transmet les fichiers comme un evenement.
 */
export async function choisirImagesPour(
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
) {
  const fichiers = await choisirFichiers({
    extensions: EXTENSIONS_IMAGES,
    libelle: "Images",
  });
  if (fichiers.length === 0) return;
  const cible = { files: fichiers, value: "" };
  handleFileSelect({ target: cible } as unknown as React.ChangeEvent<HTMLInputElement>);
}
