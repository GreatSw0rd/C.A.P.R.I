// Types du copilote de rendez-vous commercial : fiche vivante (faits cites), suivi des
// questions et objections, plan de preparation, cartes et compte-rendu.

export type EtapeSpin = "S" | "P" | "I" | "N";
export const ETAPES_SPIN: EtapeSpin[] = ["S", "P", "I", "N"];
export const NOMS_SPIN: Record<EtapeSpin, string> = {
  S: "Situation",
  P: "Problème",
  I: "Implication",
  N: "Bénéfice",
};

export type CleQualif = "budget" | "decideur" | "besoin" | "delai";
export const CLES_QUALIF: CleQualif[] = ["budget", "decideur", "besoin", "delai"];
export const NOMS_QUALIF: Record<CleQualif, string> = {
  budget: "Budget",
  decideur: "Décideur",
  besoin: "Besoin",
  delai: "Délai",
};

export type CategorieFait = EtapeSpin | CleQualif;
export const CATEGORIES: CategorieFait[] = [...ETAPES_SPIN, ...CLES_QUALIF];
export const NOM_CATEGORIE: Record<CategorieFait, string> = {
  ...NOMS_SPIN,
  ...NOMS_QUALIF,
};
export const estQualif = (c: CategorieFait): c is CleQualif =>
  (CLES_QUALIF as string[]).includes(c);

/** Statut d'un fait : dit clairement, deduit par l'IA, ou contredit plus tard. */
export type StatutFait = "confirme" | "a_confirmer" | "a_clarifier";

/** Une information retenue, toujours appuyee sur une citation exacte du client. */
export interface Fait {
  id: string;
  categorie: CategorieFait;
  valeur: string;
  citation: string;
  statut: StatutFait;
  /** Ancienne valeur en cas de contradiction (pour l'afficher). */
  avant?: string;
  heure: number;
  maj?: number;
}

export type StatutQuestion = "proposee" | "posee" | "repondue" | "ecartee";
export interface QuestionSuivie {
  id: string;
  texte: string;
  statut: StatutQuestion;
  heure: number;
}

export type StatutObjection = "soulevee" | "traitee" | "levee" | "persistante";
export interface ObjectionSuivie {
  id: string;
  sujet: string;
  citation: string;
  statut: StatutObjection;
  occurrences: number;
  heure: number;
}

/** Promesse faite pendant l'appel : par nous (souvent a la demande du client) ou par le client. */
export type QuiEngagement = "nous" | "client";
export interface Engagement {
  id: string;
  qui: QuiEngagement;
  texte: string;
  /** Echeance telle que dite ("vendredi", "la semaine prochaine"), sinon vide. */
  echeance: string;
  citation: string;
  /** Coche apres le rendez-vous, quand c'est fait. */
  fait: boolean;
  heure: number;
}

/** Element du plan (questions de la fiche de preparation), coche quand le sujet est couvert. */
export interface ElementPlan {
  id: string;
  etape: EtapeSpin;
  texte: string;
  couvert: boolean;
}

export type TypeCarte = "objection" | "question" | "signal" | "clarifier";
export type StatutCarte = "active" | "faite" | "ecartee";

/** Suggestion affichee au commercial : une seule action a la fois. */
export interface Carte {
  id: string;
  type: TypeCarte;
  titre: string;
  dire: string;
  questions: string[];
  /** Questions suivies creees par cette carte. */
  questionIds?: string[];
  objectionId?: string;
  /** Precision affichee (ex. "2e fois que le prix revient", contradiction). */
  note?: string;
  statut?: StatutCarte;
  heure: number;
}

/** Un passage entendu (ce que l'interlocuteur a dit), garde pour le compte-rendu. */
export interface Passage {
  texte: string;
  heure: number;
}

export interface Preparation {
  entreprise: string;
  interlocuteur: string;
  objectif: string;
  notes: string;
  resume: string;
  besoins: string[];
  questions: Record<EtapeSpin, string[]>;
  objections: { objection: string; parade: string }[];
  points_cles: string[];
}

export interface CompteRendu {
  resume: string;
  besoins: string[];
  objections: { objection: string; reponse: string }[];
  qualification: Qualification;
  prochaines_etapes: string[];
  email: { objet: string; corps: string };
}

/** Faits notes pour chaque etape SPIN (vue simplifiee). */
export type Spin = Record<EtapeSpin, string[]>;
/** Ce que l'on sait de la qualification (vide = a decouvrir). */
export type Qualification = Record<CleQualif, string>;

export interface Suivi {
  faits: Fait[];
  questions: QuestionSuivie[];
  objections: ObjectionSuivie[];
  plan: ElementPlan[];
  cartes: Carte[];
  engagements: Engagement[];
  /** Anciens rendez-vous (avant la fiche vivante). */
  spin?: Spin;
  qualification?: Qualification;
}

export type StatutRdv = "prepare" | "en_cours" | "termine";

export interface RendezVous {
  id: string;
  titre: string;
  entreprise: string;
  interlocuteur: string;
  statut: StatutRdv;
  preparation: Preparation | null;
  suivi: Suivi | null;
  passages: Passage[];
  compteRendu: CompteRendu | null;
  debut: number | null;
  fin: number | null;
  createdAt: number;
  updatedAt: number;
}

export const spinVide = (): Spin => ({ S: [], P: [], I: [], N: [] });
export const qualifVide = (): Qualification => ({
  budget: "",
  decideur: "",
  besoin: "",
  delai: "",
});

export const suiviVide = (): Suivi => ({
  faits: [],
  questions: [],
  objections: [],
  plan: [],
  cartes: [],
  engagements: [],
});

/** Vue SPIN derivee de la fiche (ou des anciens champs). */
export function spinDe(s: Suivi | null | undefined): Spin {
  const out = spinVide();
  if (!s) return out;
  if (!s.faits?.length && s.spin) return s.spin;
  for (const f of s.faits || []) {
    if (!estQualif(f.categorie)) out[f.categorie as EtapeSpin].push(f.valeur);
  }
  return out;
}

/** Vue qualification derivee de la fiche (derniere valeur par cle). */
export function qualifDe(s: Suivi | null | undefined): Qualification {
  const out = qualifVide();
  if (!s) return out;
  if (!s.faits?.length && s.qualification) return s.qualification;
  for (const f of s.faits || []) {
    if (estQualif(f.categorie)) out[f.categorie] = f.valeur;
  }
  return out;
}

/** Normalise un suivi lu en base (anciens rendez-vous inclus). */
export function normaliserSuivi(s: Partial<Suivi> | null | undefined): Suivi {
  return {
    ...suiviVide(),
    ...(s || {}),
    faits: s?.faits ?? [],
    questions: s?.questions ?? [],
    objections: s?.objections ?? [],
    plan: s?.plan ?? [],
    cartes: s?.cartes ?? [],
    engagements: s?.engagements ?? [],
  };
}
