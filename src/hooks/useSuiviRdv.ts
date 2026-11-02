import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/contexts";
import {
  analyserPassage,
  genererCompteRendu,
  enregistrerRendezVous,
  lireRendezVous,
  nouvelIdRdv,
  safeLocalStorage,
  fusionner,
  marquerFaite,
  marquerEcartee,
  estParasite,
  planDepuisPreparation,
  fournisseurPourUsage,
  normaliserSuivi,
  suiviVide,
  NOM_CATEGORIE,
  type Engagement,
  type Fait,
  type Passage,
  type RendezVous,
  type CompteRendu,
} from "@/lib";
import { STORAGE_KEYS } from "@/config";

/** Retour discret apres un passage sans carte. */
export type RetourPassage = "rien" | "inaudible" | "calme" | null;

/** Etiquette breve "Note" : un fait retenu ou un engagement. */
export interface NoteRecente {
  cle: string;
  libelle: string;
  valeur: string;
  ton: Fait["statut"] | "engagement";
}

const noteFait = (f: Fait): NoteRecente => ({
  cle: `${f.id}-${f.maj ?? f.heure}`,
  libelle: `${f.statut === "a_clarifier" ? "À clarifier" : "Noté"} · ${NOM_CATEGORIE[f.categorie]}`,
  valeur: f.valeur,
  ton: f.statut,
});

const noteEngagement = (e: Engagement): NoteRecente => ({
  cle: `${e.id}-${e.echeance}`,
  libelle: e.qui === "nous" ? "À faire" : "Le client fera",
  valeur: `${e.texte}${e.echeance ? ` · ${e.echeance}` : ""}`,
  ton: "engagement",
});

const DUREE_NOTE_MS = 7000;

// Rendez-vous en direct : chaque passage met a jour la fiche vivante (faits cites et
// verifies, questions et objections suivies) et ne propose qu'une action, si elle est utile.
export function useSuiviRdv() {
  const { selectedAIProvider, allAiProviders } = useApp();
  const [rdv, setRdv] = useState<RendezVous | null>(null);
  const [enAnalyse, setEnAnalyse] = useState(false);
  const [enCompteRendu, setEnCompteRendu] = useState(false);
  const [notes, setNotes] = useState<{ note: NoteRecente; heure: number }[]>([]);
  // Assistant oui / non : sans assistant, C.A.P.R.I tient la fiche et redige le
  // compte-rendu, sans afficher de suggestion pendant l'appel.
  const [assistant, setAssistantEtat] = useState(
    safeLocalStorage.getItem(STORAGE_KEYS.RDV_ASSISTANT) !== "non"
  );
  const assistantRef = useRef(assistant);
  assistantRef.current = assistant;
  const definirAssistant = useCallback((actif: boolean) => {
    safeLocalStorage.setItem(STORAGE_KEYS.RDV_ASSISTANT, actif ? "oui" : "non");
    assistantRef.current = actif;
    setAssistantEtat(actif);
  }, []);
  const [retour, setRetour] = useState<RetourPassage>(null);
  const [dernierCompteRendu, setDernierCompteRendu] = useState<{
    id: string;
    compteRendu: CompteRendu;
  } | null>(null);
  const [erreur, setErreur] = useState("");
  const rdvRef = useRef<RendezVous | null>(null);
  rdvRef.current = rdv;
  const fileRef = useRef<Promise<void>>(Promise.resolve());

  const ia = (usage: "direct" | "synthese") =>
    fournisseurPourUsage(usage, allAiProviders, selectedAIProvider);

  // Sauvegarde (differee) du rendez-vous en cours, pour le retrouver dans le tableau de bord.
  useEffect(() => {
    if (!rdv) return;
    const t = setTimeout(() => {
      enregistrerRendezVous(rdv).catch((e) =>
        console.error("Sauvegarde du rendez-vous impossible :", e)
      );
    }, 600);
    return () => clearTimeout(t);
  }, [rdv]);

  // Les etiquettes "Note" s'effacent seules.
  useEffect(() => {
    if (!notes.length) return;
    const t = setTimeout(
      () => setNotes((n) => n.filter((x) => Date.now() - x.heure < DUREE_NOTE_MS)),
      1000
    );
    return () => clearTimeout(t);
  }, [notes]);

  // Le retour discret disparait apres quelques secondes.
  useEffect(() => {
    if (!retour) return;
    const t = setTimeout(() => setRetour(null), 4500);
    return () => clearTimeout(t);
  }, [retour]);

  /** Demarre un rendez-vous, a partir d'une preparation si elle existe. */
  const demarrer = useCallback(async (idPreparation?: string | null) => {
    setErreur("");
    setDernierCompteRendu(null);
    setNotes([]);
    setRetour(null);
    let base: RendezVous | null = null;
    const id =
      idPreparation || safeLocalStorage.getItem(STORAGE_KEYS.RDV_PREPARE_ACTIF) || null;
    if (id) {
      try {
        base = await lireRendezVous(id);
      } catch {
        base = null;
      }
    }
    const maintenant = Date.now();
    const suivi = base?.suivi ? normaliserSuivi(base.suivi) : suiviVide();
    if (!suivi.plan.length) suivi.plan = planDepuisPreparation(base?.preparation ?? null);
    const nouveau: RendezVous = base
      ? { ...base, statut: "en_cours", debut: maintenant, suivi, passages: base.passages ?? [] }
      : {
          id: nouvelIdRdv(),
          titre: `Rendez-vous du ${new Date(maintenant).toLocaleDateString("fr-FR")} à ${new Date(
            maintenant
          ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
          entreprise: "",
          interlocuteur: "",
          statut: "en_cours",
          preparation: null,
          suivi,
          passages: [],
          compteRendu: null,
          debut: maintenant,
          fin: null,
          createdAt: maintenant,
          updatedAt: maintenant,
        };
    safeLocalStorage.removeItem(STORAGE_KEYS.RDV_PREPARE_ACTIF);
    setRdv(nouveau);
    return nouveau;
  }, []);

  /** Traite un passage entendu (un passage a la fois, dans l'ordre). */
  const traiterPassage = useCallback(
    (texte: string, options?: { sansAnalyse?: boolean }) => {
      const propre = texte.trim();
      fileRef.current = fileRef.current.then(async () => {
        const courant = rdvRef.current;
        if (!courant?.suivi) return;
        if (estParasite(propre)) {
          setRetour("inaudible");
          return;
        }
        const passage: Passage = { texte: propre, heure: Date.now() };
        setRdv((r) => (r ? { ...r, passages: [...r.passages, passage] } : r));
        if (options?.sansAnalyse) return;

        setEnAnalyse(true);
        setErreur("");
        setRetour(null);
        try {
          const { analyse } = await analyserPassage({
            ia: ia("direct"),
            passage: propre,
            suivi: courant.suivi,
            preparation: courant.preparation,
          });
          // Fusion sur l'etat le plus recent (un retour "Fait" a pu arriver entre-temps).
          const actuel = rdvRef.current;
          if (!actuel?.suivi) return;
          const res = fusionner(actuel.suivi, analyse, propre, Date.now(), {
            suggestions: assistantRef.current,
          });
          const maj: RendezVous = {
            ...actuel,
            passages: actuel.passages.includes(passage)
              ? actuel.passages
              : [...actuel.passages, passage],
            suivi: res.suivi,
          };
          rdvRef.current = maj;
          setRdv(maj);
          const nouvelles = [...res.engagements.map(noteEngagement), ...res.notes.map(noteFait)];
          if (nouvelles.length) {
            const h = Date.now();
            setNotes((n) => [...n, ...nouvelles.map((note) => ({ note, heure: h }))].slice(-4));
          }
          if (!res.carte && assistantRef.current) setRetour(res.enAttente ? "calme" : "rien");
        } catch (e) {
          setErreur(e instanceof Error ? e.message : String(e));
        } finally {
          setEnAnalyse(false);
        }
      });
      return fileRef.current;
    },
    [selectedAIProvider, allAiProviders]
  );

  /** Retour du commercial sur la carte affichee. */
  const retourCarte = useCallback((carteId: string, retourCommercial: "faite" | "ecartee") => {
    setRdv((r) => {
      if (!r?.suivi) return r;
      const suivi =
        retourCommercial === "faite" ? marquerFaite(r.suivi, carteId) : marquerEcartee(r.suivi, carteId);
      const maj = { ...r, suivi };
      rdvRef.current = maj;
      return maj;
    });
  }, []);

  /** Termine le rendez-vous et genere le compte-rendu (modele "synthese"). */
  const terminer = useCallback(async () => {
    await fileRef.current;
    const courant = rdvRef.current;
    if (!courant) return null;
    const fin = Date.now();
    setEnCompteRendu(true);
    setErreur("");
    let compteRendu: CompteRendu | null = null;
    try {
      if (courant.passages.length > 0) {
        compteRendu = await genererCompteRendu({
          ia: ia("synthese"),
          passages: courant.passages,
          suivi: courant.suivi ?? suiviVide(),
          preparation: courant.preparation,
        });
      }
    } catch (e) {
      setErreur(`Compte-rendu impossible : ${e instanceof Error ? e.message : String(e)}`);
    }
    const final: RendezVous = { ...courant, statut: "termine", fin, compteRendu };
    try {
      await enregistrerRendezVous(final);
    } catch (e) {
      console.error(e);
    }
    setEnCompteRendu(false);
    setRdv(null);
    setNotes([]);
    if (compteRendu) setDernierCompteRendu({ id: final.id, compteRendu });
    return final;
  }, [selectedAIProvider, allAiProviders]);

  return {
    rdv,
    enAnalyse,
    enCompteRendu,
    notes: notes.map((n) => n.note),
    assistant,
    definirAssistant,
    retour,
    dernierCompteRendu,
    fermerCompteRendu: () => setDernierCompteRendu(null),
    erreurRdv: erreur,
    demarrer,
    traiterPassage,
    retourCarte,
    terminer,
  };
}

export type SuiviRdv = ReturnType<typeof useSuiviRdv>;
