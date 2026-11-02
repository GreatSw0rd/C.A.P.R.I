// Logique de la fiche vivante (sans interface ni appel reseau, testable seule) :
// verification des citations, fusion des faits, contradictions, suivi des questions et
// objections, choix de l'unique action a proposer et delai de calme.
import {
  CATEGORIES,
  CategorieFait,
  Carte,
  ElementPlan,
  Engagement,
  ETAPES_SPIN,
  Fait,
  ObjectionSuivie,
  Preparation,
  QuestionSuivie,
  Suivi,
  TypeCarte,
} from "./types";

// ---------------------------------------------------------------------------
// Texte
// ---------------------------------------------------------------------------

export function normaliser(t: string): string {
  return (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9%€$ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MOTS_VIDES = new Set(
  "les des une un le la de du et en au aux pour par sur avec dans que qui est sont nous vous ils elles on pas plus tres tout tous mais donc car ou ce cet cette ces a d l c j n s y".split(
    " "
  )
);

const mots = (t: string) =>
  normaliser(t)
    .split(" ")
    .filter((m) => m.length > 1 && !MOTS_VIDES.has(m));

/** Similarite (0 a 1) entre deux textes courts, sur les mots porteurs de sens. */
export function similarite(a: string, b: string): number {
  const A = new Set(mots(a));
  const B = new Set(mots(b));
  if (!A.size || !B.size) return normaliser(a) === normaliser(b) ? 1 : 0;
  let commun = 0;
  A.forEach((m) => B.has(m) && commun++);
  return commun / Math.min(A.size, B.size);
}

/**
 * Une citation est valide si elle figure dans ce qu'a dit le client (a la ponctuation
 * pres), ou si l'essentiel de ses mots y figurent (transcription imparfaite).
 */
export function citationValide(citation: string, passage: string): boolean {
  const c = normaliser(citation);
  if (c.length < 3) return false;
  const p = normaliser(passage);
  if (p.includes(c)) return true;
  const m = mots(citation);
  if (m.length < 2) return false;
  const P = new Set(mots(passage));
  const presents = m.filter((x) => P.has(x)).length;
  return presents / m.length >= 0.75;
}

// Phrases inventees par Whisper sur un silence ou une musique.
const PARASITES = [
  /merci d.avoir regard/i,
  /sous[- ]titr/i,
  /amara\.org/i,
  /thanks? for watching/i,
  /abonnez[- ]vous/i,
  /^\W*(merci|thank you|bye|au revoir)\W*$/i,
  /^\W*$/,
];

/** Vrai si la transcription ne contient pas de vraie parole a analyser. */
export function estParasite(texte: string): boolean {
  const t = (texte || "").trim();
  if (!t) return true;
  if (PARASITES.some((r) => r.test(t))) return true;
  return mots(t).length < 2 && t.length < 12;
}

// ---------------------------------------------------------------------------
// Plan de preparation
// ---------------------------------------------------------------------------

export function planDepuisPreparation(p: Preparation | null): ElementPlan[] {
  if (!p) return [];
  const plan: ElementPlan[] = [];
  for (const e of ETAPES_SPIN) {
    for (const q of p.questions?.[e] ?? []) {
      plan.push({ id: `p${plan.length + 1}`, etape: e, texte: q, couvert: false });
    }
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Resultat de l'analyse d'un passage (tel que renvoye par l'IA)
// ---------------------------------------------------------------------------

export interface OpFait {
  op: "ajouter" | "preciser" | "contradiction";
  id?: string;
  categorie?: CategorieFait;
  valeur: string;
  citation: string;
  certitude?: "explicite" | "deduit";
  question?: string;
}

export interface OpObjection {
  op: "nouvelle" | "revient" | "levee";
  id?: string;
  sujet?: string;
  citation?: string;
}

export interface ActionIA {
  type: TypeCarte;
  titre: string;
  dire: string;
  questions: string[];
  objection_id?: string;
}

export interface OpEngagement {
  qui: "nous" | "client";
  texte: string;
  echeance: string;
  citation: string;
}

export interface AnalyseIA {
  operations: OpFait[];
  questions_repondues: string[];
  plan_couvert: string[];
  objections: OpObjection[];
  engagements: OpEngagement[];
  action: ActionIA | null;
}

const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const nul = (v: string) => /^(null|none|aucun|aucune|n\/a|-|inconnu|)$/i.test(v);

/** Lit (avec tolerance) le JSON renvoye par l'IA. */
export function lireAnalyseIA(j: any): AnalyseIA {
  const ops: OpFait[] = (Array.isArray(j?.operations) ? j.operations : [])
    .map((o: any) => ({
      op: ["ajouter", "preciser", "contradiction"].includes(o?.op) ? o.op : "ajouter",
      id: texte(o?.id) || undefined,
      categorie: (CATEGORIES as string[]).includes(o?.categorie) ? o.categorie : undefined,
      valeur: texte(o?.valeur),
      citation: texte(o?.citation),
      certitude: o?.certitude === "deduit" ? "deduit" : "explicite",
      question: texte(o?.question) || undefined,
    }))
    .filter((o: OpFait) => o.valeur && !nul(o.valeur));
  const objs: OpObjection[] = (Array.isArray(j?.objections) ? j.objections : [])
    .map((o: any) => ({
      op: ["nouvelle", "revient", "levee"].includes(o?.op) ? o.op : "nouvelle",
      id: texte(o?.id) || undefined,
      sujet: texte(o?.sujet) || undefined,
      citation: texte(o?.citation) || undefined,
    }))
    .filter((o: OpObjection) => o.id || o.sujet);
  const engs: OpEngagement[] = (Array.isArray(j?.engagements) ? j.engagements : [])
    .map((e: any) => ({
      qui: e?.qui === "client" ? "client" : "nous",
      texte: texte(e?.texte),
      echeance: nul(texte(e?.echeance)) ? "" : texte(e?.echeance),
      citation: texte(e?.citation),
    }))
    .filter((e: OpEngagement) => e.texte && !nul(e.texte));
  const a = j?.action;
  const type: TypeCarte = ["objection", "question", "signal", "clarifier"].includes(a?.type)
    ? a.type
    : "question";
  const action: ActionIA | null =
    a && typeof a === "object"
      ? {
          type,
          titre: texte(a.titre),
          dire: nul(texte(a.dire)) ? "" : texte(a.dire),
          questions: (Array.isArray(a.questions) ? a.questions : [])
            .map(texte)
            .filter((q: string) => q && !nul(q))
            .slice(0, 2),
          objection_id: texte(a.objection_id) || undefined,
        }
      : null;
  const ids = (v: unknown) =>
    Array.isArray(v) ? v.map(texte).filter(Boolean) : [];
  return {
    operations: ops,
    questions_repondues: ids(j?.questions_repondues),
    plan_couvert: ids(j?.plan_couvert),
    objections: objs,
    engagements: engs,
    action:
      action && (action.dire || action.questions.length) ? action : null,
  };
}

// ---------------------------------------------------------------------------
// Fusion dans la fiche vivante
// ---------------------------------------------------------------------------

/** Delai de calme : pas de nouvelle question/signal tant que la carte precedente est fraiche. */
export const DELAI_CALME_MS = 20_000;

export interface ResultatFusion {
  suivi: Suivi;
  /** Faits ajoutes ou modifies par ce passage (pour les etiquettes "Note"). */
  notes: Fait[];
  /** Engagements ajoutes ou precises par ce passage. */
  engagements: Engagement[];
  carte: Carte | null;
  rejetes: number;
  /** Carte supprimee par le delai de calme (pour information). */
  enAttente: boolean;
}

let compteur = 0;
const nouvelId = (prefixe: string) => `${prefixe}${Date.now().toString(36)}${(compteur++).toString(36)}`;

export function fusionner(
  suiviInitial: Suivi,
  analyse: AnalyseIA,
  passage: string,
  maintenant = Date.now(),
  options: { suggestions?: boolean } = {}
): ResultatFusion {
  const suivi: Suivi = {
    ...suiviInitial,
    faits: suiviInitial.faits.map((f) => ({ ...f })),
    questions: suiviInitial.questions.map((q) => ({ ...q })),
    objections: suiviInitial.objections.map((o) => ({ ...o })),
    plan: suiviInitial.plan.map((p) => ({ ...p })),
    cartes: [...suiviInitial.cartes],
    engagements: (suiviInitial.engagements ?? []).map((e) => ({ ...e })),
  };
  const notes: Fait[] = [];
  let rejetes = 0;
  let contradiction: { fait: Fait; question?: string } | null = null;

  const noter = (f: Fait) => {
    const i = notes.findIndex((n) => n.id === f.id);
    if (i >= 0) notes[i] = f;
    else notes.push(f);
  };

  for (const op of analyse.operations) {
    if (!citationValide(op.citation, passage)) {
      rejetes++;
      continue;
    }
    const statut = op.certitude === "deduit" ? "a_confirmer" : "confirme";
    let cible = op.id ? suivi.faits.find((f) => f.id === op.id) : undefined;

    if (op.op === "ajouter" || !cible) {
      if (!op.categorie && !cible) {
        rejetes++;
        continue;
      }
      const categorie = op.categorie ?? cible!.categorie;
      // Doublon ? Meme categorie et sens proche. Une valeur differente sur une meme cle de
      // qualification est ajoutee a cote : l'ecraser ferait perdre une information (ex. un
      // avis sur le prix remplacant le montant du budget).
      cible =
        cible ??
        suivi.faits.find((f) => f.categorie === categorie && similarite(f.valeur, op.valeur) >= 0.6);
      if (!cible) {
        const nouveau: Fait = {
          id: nouvelId("f"),
          categorie,
          valeur: op.valeur,
          citation: op.citation,
          statut,
          heure: maintenant,
        };
        suivi.faits.push(nouveau);
        noter(nouveau);
        continue;
      }
    }

    // Mise a jour d'un fait existant.
    if (op.op === "contradiction" && similarite(cible.valeur, op.valeur) < 0.8) {
      cible.avant = cible.valeur;
      cible.valeur = op.valeur;
      cible.citation = op.citation;
      cible.statut = "a_clarifier";
      cible.maj = maintenant;
      contradiction = { fait: cible, question: op.question };
      noter(cible);
    } else if (similarite(cible.valeur, op.valeur) < 0.95 || cible.statut !== statut) {
      // Precision : on garde la formulation la plus complete.
      if (op.valeur.length >= cible.valeur.length * 0.6) cible.valeur = op.valeur;
      cible.citation = op.citation;
      if (statut === "confirme") {
        // Le client a tranche : la contradiction est resolue.
        cible.statut = "confirme";
        delete cible.avant;
      }
      cible.maj = maintenant;
      noter(cible);
    }
  }

  // Questions auxquelles le client a repondu (posees ou non).
  for (const id of analyse.questions_repondues) {
    const q = suivi.questions.find((x) => x.id === id);
    if (q && q.statut !== "ecartee") q.statut = "repondue";
  }
  // Plan de preparation couvert.
  for (const id of analyse.plan_couvert) {
    const p = suivi.plan.find((x) => x.id === id);
    if (p) p.couvert = true;
  }

  // Objections : nouvelle, qui revient, ou levee.
  let objectionDuPassage: ObjectionSuivie | null = null;
  for (const o of analyse.objections) {
    if (o.op === "levee") {
      const ex = suivi.objections.find((x) => x.id === o.id);
      if (ex) ex.statut = "levee";
      continue;
    }
    if (o.citation && !citationValide(o.citation, passage)) {
      rejetes++;
      continue;
    }
    let ex =
      (o.id ? suivi.objections.find((x) => x.id === o.id) : undefined) ??
      (o.sujet
        ? suivi.objections.find(
            (x) => x.statut !== "levee" && similarite(x.sujet, o.sujet!) >= 0.5
          )
        : undefined);
    if (ex) {
      ex.occurrences += 1;
      ex.statut = "persistante";
      if (o.citation) ex.citation = o.citation;
    } else if (o.sujet) {
      ex = {
        id: nouvelId("o"),
        sujet: o.sujet,
        citation: o.citation || "",
        statut: "soulevee",
        occurrences: 1,
        heure: maintenant,
      };
      suivi.objections.push(ex);
    }
    if (ex) objectionDuPassage = ex;
  }

  // Engagements : citation verifiee, pas de doublon (on complete l'echeance si elle arrive).
  const engagements: Engagement[] = [];
  for (const e of analyse.engagements ?? []) {
    if (!citationValide(e.citation, passage)) {
      rejetes++;
      continue;
    }
    const ex = suivi.engagements.find((x) => x.qui === e.qui && similarite(x.texte, e.texte) >= 0.6);
    if (ex) {
      if (e.echeance && e.echeance !== ex.echeance) {
        ex.echeance = e.echeance;
        engagements.push(ex);
      }
      continue;
    }
    const nouveau: Engagement = {
      id: nouvelId("e"),
      qui: e.qui,
      texte: e.texte,
      echeance: e.echeance,
      citation: e.citation,
      fait: false,
      heure: maintenant,
    };
    suivi.engagements.push(nouveau);
    engagements.push(nouveau);
  }

  // ---- Choix de l'unique action a proposer ---------------------------------
  // Assistant desactive : la fiche se tient a jour, mais aucune suggestion n'est affichee.
  let action =
    options.suggestions !== false && analyse.action
      ? { ...analyse.action, questions: [...analyse.action.questions] }
      : null;

  // Priorite 1 : objection de ce passage.
  if (objectionDuPassage && action && action.type !== "objection") {
    action = { ...action, type: "objection" };
  }
  // Priorite 2 : contradiction sans objection -> clarifier.
  if (options.suggestions !== false && !objectionDuPassage && contradiction) {
    const q = contradiction.question || action?.questions?.[0] || "";
    action = {
      type: "clarifier",
      titre: `${contradiction.fait.categorie === "budget" ? "Budget" : "Point"} à clarifier`,
      dire: action?.type === "clarifier" ? action.dire : "",
      questions: q ? [q] : [],
    };
  }

  // Ne jamais reproposer une question deja suivie ou une suggestion ecartee.
  const ecartees = suivi.cartes.filter((c) => c.statut === "ecartee");
  if (action) {
    action.questions = action.questions
      .filter(
        (q) =>
          !suivi.questions.some((s) => similarite(s.texte, q) >= 0.6) &&
          !ecartees.some((c) => c.questions.some((x) => similarite(x, q) >= 0.6))
      )
      .slice(0, 2);
    const repete = ecartees.some(
      (c) => c.type === action!.type && similarite(c.titre, action!.titre) >= 0.6
    );
    if (repete || (!action.dire && action.questions.length === 0)) action = null;
  }

  // Delai de calme pour les questions et signaux.
  let enAttente = false;
  const derniere = [...suivi.cartes].reverse().find((c) => (c.statut ?? "active") === "active");
  if (
    action &&
    (action.type === "question" || action.type === "signal") &&
    derniere &&
    maintenant - derniere.heure < DELAI_CALME_MS
  ) {
    action = null;
    enAttente = true;
  }

  let carte: Carte | null = null;
  if (action) {
    const questionIds: string[] = [];
    for (const q of action.questions) {
      const qs: QuestionSuivie = { id: nouvelId("q"), texte: q, statut: "proposee", heure: maintenant };
      suivi.questions.push(qs);
      questionIds.push(qs.id);
    }
    let note: string | undefined;
    if (objectionDuPassage && objectionDuPassage.occurrences > 1) {
      note = `${objectionDuPassage.occurrences}e fois que ce frein revient`;
    } else if (contradiction?.fait.avant) {
      note = `Avant : « ${contradiction.fait.avant} » · Maintenant : « ${contradiction.fait.valeur} »`;
    }
    carte = {
      id: nouvelId("c"),
      type: action.type,
      titre: action.titre || (objectionDuPassage ? objectionDuPassage.sujet : "Suggestion"),
      dire: action.dire,
      questions: action.questions,
      questionIds,
      objectionId: objectionDuPassage?.id,
      note,
      statut: "active",
      heure: maintenant,
    };
    suivi.cartes.push(carte);
  }

  return { suivi, notes, engagements, carte, rejetes, enAttente };
}

// ---------------------------------------------------------------------------
// Retours du commercial sur une carte
// ---------------------------------------------------------------------------

/** "Fait" : la question a ete posee / la parade utilisee. */
export function marquerFaite(s: Suivi, carteId: string): Suivi {
  const carte = s.cartes.find((c) => c.id === carteId);
  if (!carte) return s;
  return {
    ...s,
    cartes: s.cartes.map((c) => (c.id === carteId ? { ...c, statut: "faite" } : c)),
    questions: s.questions.map((q) =>
      carte.questionIds?.includes(q.id) && q.statut === "proposee" ? { ...q, statut: "posee" } : q
    ),
    objections: s.objections.map((o) =>
      o.id === carte.objectionId && o.statut !== "levee" ? { ...o, statut: "traitee" } : o
    ),
  };
}

/** "Pas pertinent" : la suggestion ne reviendra pas. */
export function marquerEcartee(s: Suivi, carteId: string): Suivi {
  const carte = s.cartes.find((c) => c.id === carteId);
  if (!carte) return s;
  return {
    ...s,
    cartes: s.cartes.map((c) => (c.id === carteId ? { ...c, statut: "ecartee" } : c)),
    questions: s.questions.map((q) =>
      carte.questionIds?.includes(q.id) && q.statut === "proposee" ? { ...q, statut: "ecartee" } : q
    ),
  };
}

/** Coche (ou decoche) un engagement apres le rendez-vous. */
export function marquerEngagement(s: Suivi, id: string, fait: boolean): Suivi {
  return {
    ...s,
    engagements: (s.engagements ?? []).map((e) => (e.id === id ? { ...e, fait } : e)),
  };
}
