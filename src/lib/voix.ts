// Voix de C.A.P.R.I : lecture a voix haute avec les voix installees dans le systeme
// (Windows : voix Microsoft), gratuite et hors ligne.

type Ecouteurs = { cle?: string; onDebut?: () => void; onFin?: () => void };

// Evenement "capri-voix" : detail = cle de la lecture en cours, ou null quand plus rien n'est lu.
export const EVENEMENT_VOIX = "capri-voix";
let cleEnCours: string | null = null;
function annoncer(cle: string | null) {
  cleEnCours = cle;
  window.dispatchEvent(new CustomEvent(EVENEMENT_VOIX, { detail: cle }));
}
export function lectureEnCours(): string | null {
  return cleEnCours;
}

const synth: SpeechSynthesis | undefined =
  typeof window !== "undefined" ? window.speechSynthesis : undefined;

let lectureId = 0;

export function voixDisponible(): boolean {
  return !!synth;
}

// Meilleure voix francaise disponible : d'abord les voix "naturelles" (neurales), puis
// les voix Microsoft classiques, puis n'importe quelle voix francaise.
function voixFrancaise(): SpeechSynthesisVoice | undefined {
  const voix = (synth?.getVoices() ?? []).filter((v) =>
    v.lang?.toLowerCase().startsWith("fr")
  );
  return (
    voix.find((v) => /natural|neural|online/i.test(v.name)) ||
    voix.find((v) => /microsoft/i.test(v.name)) ||
    voix[0]
  );
}
// Les voix se chargent de facon asynchrone : on les demande tot.
synth?.getVoices();

// Texte lisible a voix haute a partir d'une reponse Markdown.
export function texteAParler(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/[«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function arreterVoix() {
  lectureId++;
  synth?.cancel();
  if (cleEnCours !== null) annoncer(null);
}

export function voixEnCours(): boolean {
  return !!synth?.speaking;
}

/** Lit le texte (Markdown accepte). Une nouvelle lecture remplace la precedente. */
export function parler(markdown: string, { cle = "voix", onDebut, onFin }: Ecouteurs = {}) {
  const texte = texteAParler(markdown);
  if (!synth || !texte) {
    onFin?.();
    return;
  }
  arreterVoix();
  const id = lectureId;
  annoncer(cle);
  const fin = () => {
    if (id !== lectureId) return;
    annoncer(null);
    onFin?.();
  };

  // Phrase par phrase : la lecture commence plus vite et ne se coupe pas sur un long texte.
  const phrases = texte.match(/[^.!?…]+[.!?…]*\s*/g) ?? [texte];
  const voix = voixFrancaise();
  phrases.forEach((phrase, i) => {
    const u = new SpeechSynthesisUtterance(phrase.trim());
    u.lang = "fr-FR";
    if (voix) u.voice = voix;
    u.rate = 1.05;
    if (i === 0) u.onstart = () => id === lectureId && onDebut?.();
    if (i === phrases.length - 1) {
      u.onend = fin;
      u.onerror = fin;
    }
    synth.speak(u);
  });
}
