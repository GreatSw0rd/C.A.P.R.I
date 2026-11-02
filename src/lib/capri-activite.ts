import { emit, listen } from "@tauri-apps/api/event";

// Activite de C.A.P.R.I, lue image par image par l'orbe animee.
// - "parole"    : quelqu'un parle (micro ou son de l'ordinateur), l'orbe suit le volume
// - "reponse"   : la reponse s'ecrit, l'orbe pulse a chaque morceau recu
// - "reflexion" : en attente de la reponse, l'orbe s'agite
// - "ecoute"    : ecoute en cours mais silence, l'orbe respire
// - "repos"     : rien en cours
export type ModeCapri = "repos" | "ecoute" | "reflexion" | "reponse" | "parole";

type Drapeau = "ecoute" | "reflexion" | "reponse";

const EVENEMENT = "capri-activite";

const etat = {
  // Cle "drapeau:source" : plusieurs sources (Demander, Ecouter) peuvent etre actives.
  drapeaux: new Set<string>(),
  niveauAudio: 0,
  dernierAudio: 0,
  impulsion: 0,
  dernierCalcul: 0,
  // Etat recu d'une autre fenetre (le tableau de bord affiche l'activite de l'overlay).
  distant: null as null | { mode: ModeCapri; niveau: number; recu: number },
};

let dernierEnvoi = 0;
let dernierModeEnvoye: ModeCapri = "repos";

/** Volume entendu (RMS d'un bloc audio, entre 0 et ~0.3). */
export function signalerAudio(rms: number) {
  // Seuil de bruit de fond : un micro silencieux ne doit pas faire bouger l'orbe.
  const niveau = Math.min(1, Math.max(0, Math.sqrt(Math.max(0, rms)) - 0.07) * 4);
  etat.niveauAudio = Math.max(niveau, etat.niveauAudio * 0.6);
  etat.dernierAudio = performance.now();
  diffuser();
}

/** Un morceau de reponse vient d'arriver. */
export function signalerImpulsion(force = 0.35) {
  etat.impulsion = Math.min(1, etat.impulsion + force);
  diffuser();
}

export function definirDrapeau(drapeau: Drapeau, actif: boolean, source = "demander") {
  const cle = `${drapeau}:${source}`;
  if (actif === etat.drapeaux.has(cle)) return;
  if (actif) etat.drapeaux.add(cle);
  else etat.drapeaux.delete(cle);
  diffuser(true);
}

const actif = (drapeau: Drapeau) => {
  for (const cle of etat.drapeaux) if (cle.startsWith(drapeau + ":")) return true;
  return false;
};

export function modeCapri(): ModeCapri {
  const now = performance.now();
  if (etat.distant && now - etat.distant.recu < 1500) return etat.distant.mode;
  if (now - etat.dernierAudio < 250 && etat.niveauAudio > 0.15) return "parole";
  if (actif("reponse")) return "reponse";
  if (actif("reflexion")) return "reflexion";
  if (actif("ecoute")) return "ecoute";
  return "repos";
}

/** Intensite entre 0 et 1, appelee a chaque image par l'orbe. */
export function lireActivite(): number {
  const now = performance.now();
  const dt = etat.dernierCalcul ? Math.min(0.1, (now - etat.dernierCalcul) / 1000) : 0;
  etat.dernierCalcul = now;
  etat.impulsion *= Math.exp(-dt * 4);
  if (now - etat.dernierAudio > 120) etat.niveauAudio *= Math.exp(-dt * 6);

  const t = now / 1000;
  if (etat.distant && now - etat.distant.recu < 1500) {
    return etat.distant.niveau;
  }
  switch (modeCapri()) {
    case "parole":
      return 0.25 + 0.75 * etat.niveauAudio;
    case "reponse":
      return 0.3 + 0.6 * etat.impulsion + 0.05 * Math.sin(t * 9);
    case "reflexion":
      return 0.45 + 0.2 * Math.sin(t * 6) + 0.1 * Math.sin(t * 13);
    case "ecoute":
      return 0.08 + 0.06 * Math.sin(t * 1.6) + 0.5 * etat.niveauAudio;
    default:
      return 0.5 * etat.impulsion;
  }
}

// Envoie l'activite aux autres fenetres (au plus ~12 fois par seconde).
function diffuser(force = false) {
  const now = performance.now();
  const mode = modeCapri();
  if (!force && now - dernierEnvoi < 80) return;
  if (mode === "repos" && dernierModeEnvoye === "repos" && !force) return;
  dernierEnvoi = now;
  dernierModeEnvoye = mode;
  emit(EVENEMENT, { mode, niveau: lireActivite() }).catch(() => {});
}

// Pendant une activite, on continue d'envoyer meme sans nouvel evenement (respiration, reflexion).
let minuterie: ReturnType<typeof setInterval> | null = null;
export function demarrerDiffusion() {
  if (minuterie) return;
  minuterie = setInterval(() => {
    if (modeCapri() !== "repos" || dernierModeEnvoye !== "repos") diffuser();
  }, 90);
}

/** Dans une fenetre qui ne fait qu'afficher (tableau de bord) : recevoir l'activite de l'overlay. */
export function recevoirActivite(): () => void {
  const un = listen<{ mode: ModeCapri; niveau: number }>(EVENEMENT, (e) => {
    etat.distant = { ...e.payload, recu: performance.now() };
  });
  return () => {
    un.then((fn) => fn());
  };
}
