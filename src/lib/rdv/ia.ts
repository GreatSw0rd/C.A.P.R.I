import { fetchAIResponse } from "../functions";
import { withKnowledge } from "../database/knowledge.action";
import type { TYPE_PROVIDER } from "@/types";
import {
  CompteRendu,
  ETAPES_SPIN,
  EtapeSpin,
  NOM_CATEGORIE,
  Passage,
  Preparation,
  Suivi,
  CLES_QUALIF,
  qualifVide,
  qualifDe,
} from "./types";
import { AnalyseIA, lireAnalyseIA } from "./fusion";
import { CONSIGNE_ANALYSE, construireMessageAnalyse } from "./consignes";

export interface FournisseurIA {
  provider: TYPE_PROVIDER | undefined;
  selectedProvider: { provider: string; variables: Record<string, string> };
}

/** Appelle l'IA avec une consigne brute et renvoie le texte complet. */
async function appelerIA(
  ia: FournisseurIA,
  consigne: string,
  message: string,
  options: { signal?: AbortSignal; json?: boolean; temperature?: number } = {}
): Promise<string> {
  const consigneK = (await withKnowledge(consigne)) || consigne;
  const lancer = async (json: boolean) => {
    let texte = "";
    for await (const morceau of fetchAIResponse({
      provider: ia.provider,
      selectedProvider: ia.selectedProvider,
      systemPrompt: consigneK,
      history: [],
      userMessage: message,
      imagesBase64: [],
      signal: options.signal,
      consigneBrute: true,
      formatJson: json,
      temperature: options.temperature,
    })) {
      texte += morceau;
    }
    return texte;
  };
  try {
    return await lancer(!!options.json);
  } catch (e) {
    // Certains modeles refusent le format JSON impose : on reessaie sans.
    if (options.json && /response_format|json/i.test(String(e))) return lancer(false);
    throw e;
  }
}

/** Extrait le premier objet JSON d'une reponse (tolere ```json et texte autour). */
export function extraireJson(texte: string): any | null {
  if (!texte) return null;
  const sansBalises = texte.replace(/```(?:json)?/gi, "");
  const debut = sansBalises.indexOf("{");
  const fin = sansBalises.lastIndexOf("}");
  if (debut === -1 || fin <= debut) return null;
  try {
    return JSON.parse(sansBalises.slice(debut, fin + 1));
  } catch {
    return null;
  }
}

const chaine = (v: unknown): string =>
  typeof v === "string" ? v.trim() : "";
const vraieValeur = (v: unknown): string => {
  const s = chaine(v);
  return /^(null|none|aucun|aucune|n\/a|-|inconnu)$/i.test(s) ? "" : s;
};
const liste = (v: unknown, max = 6): string[] =>
  Array.isArray(v) ? v.map(vraieValeur).filter(Boolean).slice(0, max) : [];

// ---------------------------------------------------------------------------
// Analyse d'un passage pendant le rendez-vous
// ---------------------------------------------------------------------------

export interface ResultatAnalyse {
  analyse: AnalyseIA;
  brut: string;
}

export async function analyserPassage(params: {
  ia: FournisseurIA;
  passage: string;
  suivi: Suivi;
  preparation: Preparation | null;
  signal?: AbortSignal;
}): Promise<ResultatAnalyse> {
  const brut = await appelerIA(params.ia, CONSIGNE_ANALYSE, construireMessageAnalyse(params), {
    signal: params.signal,
    json: true,
    temperature: 0.2,
  });
  const j = extraireJson(brut);
  return {
    analyse: lireAnalyseIA(j ?? {}),
    brut,
  };
}

// ---------------------------------------------------------------------------
// Fiche de preparation avant le rendez-vous
// ---------------------------------------------------------------------------

const CONSIGNE_PREPARATION = `Tu prépares un commercial à un rendez-vous de découverte (méthode SPIN).
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "resume": "2 à 3 phrases sur le contexte et l'enjeu du rendez-vous",
  "objectif": "objectif concret du rendez-vous en une phrase",
  "besoins": ["besoin probable (hypothèse)"],
  "questions": {"S": ["question ouverte"], "P": ["..."], "I": ["..."], "N": ["..."]},
  "objections": [{"objection": "objection probable", "parade": "réponse courte"}],
  "points_cles": ["point à mettre en avant"]
}
Règles : 2 questions ouvertes par étape SPIN, 3 objections maximum, 4 points clés maximum.
N'affirme comme fait QUE ce qui est fourni par le commercial ou les connaissances ; le reste est une hypothèse à vérifier.
Appuie-toi sur l'offre et les connaissances fournies. Français, phrases courtes.`;

export async function genererPreparation(params: {
  ia: FournisseurIA;
  entreprise: string;
  interlocuteur: string;
  objectif: string;
  notes: string;
}): Promise<Preparation> {
  const message = [
    `Entreprise : ${params.entreprise || "non précisée"}`,
    `Interlocuteur : ${params.interlocuteur || "non précisé"}`,
    `Objectif du commercial : ${params.objectif || "découverte"}`,
    `Notes du commercial : ${params.notes || "aucune"}`,
  ].join("\n");
  const texte = await appelerIA(params.ia, CONSIGNE_PREPARATION, message, {
    json: true,
    temperature: 0.4,
  });
  const j = extraireJson(texte);
  if (!j) throw new Error("La fiche n'a pas pu être générée. Réessayez.");
  const questions = {} as Record<EtapeSpin, string[]>;
  for (const e of ETAPES_SPIN) questions[e] = liste(j.questions?.[e], 3);
  return {
    entreprise: params.entreprise,
    interlocuteur: params.interlocuteur,
    objectif: vraieValeur(j.objectif) || params.objectif,
    notes: params.notes,
    resume: vraieValeur(j.resume),
    besoins: liste(j.besoins, 5),
    questions,
    objections: (Array.isArray(j.objections) ? j.objections : [])
      .map((o: any) => ({
        objection: vraieValeur(o?.objection),
        parade: vraieValeur(o?.parade),
      }))
      .filter((o: any) => o.objection)
      .slice(0, 3),
    points_cles: liste(j.points_cles, 4),
  };
}

// ---------------------------------------------------------------------------
// Compte-rendu en fin de rendez-vous
// ---------------------------------------------------------------------------

const CONSIGNE_COMPTE_RENDU = `Tu rédiges le compte-rendu d'un rendez-vous commercial qui vient de se terminer.
Tu reçois ce qu'a dit l'interlocuteur, les faits SPIN notés, la qualification et la préparation éventuelle.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "resume": "3 à 5 phrases : contexte, enjeux, niveau d'intérêt",
  "besoins": ["besoin identifié"],
  "objections": [{"objection": "frein exprimé", "reponse": "réponse apportée ou à apporter"}],
  "qualification": {"budget": "... ou vide", "decideur": "...", "besoin": "...", "delai": "..."},
  "prochaines_etapes": ["action concrète, avec échéance si connue"],
  "email": {"objet": "objet de l'e-mail de relance", "corps": "e-mail de relance court, vouvoiement, signé [Votre nom]"}
}
Règles : n'invente aucun chiffre ni engagement qui n'a pas été dit. Si une information manque, laisse-la vide.
"prochaines_etapes" reprend TOUS les engagements notés (les nôtres d'abord), avec leur échéance ; l'e-mail confirme ce que nous avons promis.
Français, ton professionnel.`;

export async function genererCompteRendu(params: {
  ia: FournisseurIA;
  passages: Passage[];
  suivi: Suivi;
  preparation: Preparation | null;
}): Promise<CompteRendu> {
  const { passages, suivi, preparation } = params;
  const qualification = qualifDe(suivi);
  const message = [
    preparation
      ? `Préparation : entreprise ${preparation.entreprise}, interlocuteur ${preparation.interlocuteur}, objectif ${preparation.objectif}.`
      : "",
    `FICHE DU RENDEZ-VOUS (faits vérifiés, avec la citation du client) :\n${
      suivi.faits
        .map(
          (f) =>
            `- ${NOM_CATEGORIE[f.categorie]} : ${f.valeur}${
              f.statut === "a_clarifier" ? ` (à clarifier, avant : ${f.avant})` : f.statut === "a_confirmer" ? " (à confirmer)" : ""
            } — « ${f.citation} »`
        )
        .join("\n") || "(vide)"
    }`,
    suivi.objections.length
      ? `Objections : ${suivi.objections
          .map((o) => `${o.sujet} (${o.statut}, ${o.occurrences} fois)`)
          .join(" ; ")}`
      : "",
    suivi.engagements?.length
      ? `Engagements pris pendant l'appel :\n${suivi.engagements
          .map((e) => `- ${e.qui === "nous" ? "Nous" : "Le client"} : ${e.texte}${e.echeance ? ` (${e.echeance})` : ""}`)
          .join("\n")}`
      : "",
    `Questions restées sans réponse : ${
      suivi.questions.filter((q) => q.statut === "posee").map((q) => q.texte).join(" ; ") || "aucune"
    }`,
    `Ce qu'a dit l'interlocuteur (dans l'ordre) :\n${passages
      .map((p) => `- ${p.texte}`)
      .join("\n")
      .slice(-12000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const texte = await appelerIA(params.ia, CONSIGNE_COMPTE_RENDU, message, {
    json: true,
    temperature: 0.3,
  });
  const j = extraireJson(texte);
  if (!j) {
    return {
      resume: texte.trim().slice(0, 2000),
      besoins: [],
      objections: [],
      qualification,
      prochaines_etapes: [],
      email: { objet: "", corps: "" },
    };
  }
  const q = qualifVide();
  for (const c of CLES_QUALIF) q[c] = vraieValeur(j.qualification?.[c]) || qualification[c];
  return {
    resume: vraieValeur(j.resume),
    besoins: liste(j.besoins, 8),
    objections: (Array.isArray(j.objections) ? j.objections : [])
      .map((o: any) => ({
        objection: vraieValeur(o?.objection),
        reponse: vraieValeur(o?.reponse),
      }))
      .filter((o: any) => o.objection)
      .slice(0, 6),
    qualification: q,
    prochaines_etapes: liste(j.prochaines_etapes, 6),
    email: {
      objet: vraieValeur(j.email?.objet),
      corps: vraieValeur(j.email?.corps),
    },
  };
}
