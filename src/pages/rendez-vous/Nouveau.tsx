import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2Icon, RefreshCwIcon, SaveIcon, SparklesIcon } from "lucide-react";
import { Button, Input, Textarea } from "@/components";
import { PageLayout } from "@/layouts";
import { useApp } from "@/contexts";
import { cn } from "@/lib/utils";
import {
  genererPreparation,
  fournisseurPourUsage,
  enregistrerRendezVous,
  nouvelIdRdv,
  safeLocalStorage,
  type Preparation,
} from "@/lib";
import { STORAGE_KEYS } from "@/config";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BorderBeam } from "@/components/ui/border-beam";
import { FX } from "@/components/fx";
import { Bloc, FichePreparation } from "./components/Vues";

const OBJECTIFS = ["Découverte", "Démonstration", "Proposition", "Négociation", "Relance"];

// Preparer un rendez-vous : quelques infos, puis C.A.P.R.I propose la fiche (questions SPIN,
// objections probables, points cles). La fiche servira pendant l'appel.
const NouveauRdv = () => {
  const navigate = useNavigate();
  const { selectedAIProvider, allAiProviders } = useApp();
  const [entreprise, setEntreprise] = useState("");
  const [interlocuteur, setInterlocuteur] = useState("");
  const [objectif, setObjectif] = useState("Découverte");
  const [notes, setNotes] = useState("");
  const [fiche, setFiche] = useState<Preparation | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const generer = async () => {
    setEnCours(true);
    setErreur("");
    try {
      setFiche(
        await genererPreparation({
          ia: fournisseurPourUsage("synthese", allAiProviders, selectedAIProvider),
          entreprise: entreprise.trim(),
          interlocuteur: interlocuteur.trim(),
          objectif,
          notes: notes.trim(),
        })
      );
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const enregistrer = async (utiliser: boolean) => {
    const maintenant = Date.now();
    const id = nouvelIdRdv();
    const preparation: Preparation = fiche ?? {
      entreprise: entreprise.trim(),
      interlocuteur: interlocuteur.trim(),
      objectif,
      notes: notes.trim(),
      resume: "",
      besoins: [],
      questions: { S: [], P: [], I: [], N: [] },
      objections: [],
      points_cles: [],
    };
    await enregistrerRendezVous({
      id,
      titre: `${objectif} · ${entreprise.trim() || "Prospect"}`,
      entreprise: entreprise.trim(),
      interlocuteur: interlocuteur.trim(),
      statut: "prepare",
      preparation,
      suivi: null,
      passages: [],
      compteRendu: null,
      debut: null,
      fin: null,
      createdAt: maintenant,
      updatedAt: maintenant,
    });
    if (utiliser) safeLocalStorage.setItem(STORAGE_KEYS.RDV_PREPARE_ACTIF, id);
    navigate(`/rendez-vous/${id}`);
  };

  return (
    <PageLayout
      sectionCards={false}
      allowBackButton
      title="Préparer un rendez-vous"
      description="Quelques informations suffisent. C.A.P.R.I prépare vos questions SPIN et les objections probables, en s'appuyant sur vos Connaissances."
    >
      <div className="relative space-y-4 rounded-2xl border border-border bg-card/70 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium">Entreprise</span>
            <Input
              placeholder="ex. Transports Lefèvre"
              value={entreprise}
              onChange={(e) => setEntreprise(e.target.value)}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium">Interlocuteur</span>
            <Input
              placeholder="ex. Claire Martin, directrice des opérations"
              value={interlocuteur}
              onChange={(e) => setInterlocuteur(e.target.value)}
            />
          </label>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-medium">Objectif</span>
          <div className="flex flex-wrap gap-1.5">
            {OBJECTIFS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setObjectif(o)}
                className={cn(
                  "rounded-lg border px-3 py-1 text-xs transition-colors",
                  objectif === o
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium">Ce que vous savez déjà</span>
          <Textarea
            className="min-h-[90px]"
            placeholder="Contexte, échanges précédents, équipement actuel, concurrent en place, enjeux…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <ShimmerButton
            onClick={generer}
            disabled={enCours}
            background="linear-gradient(135deg, rgba(124,77,255,0.85), rgba(59,29,143,0.85))"
            shimmerColor={FX.vert}
            borderRadius="12px"
            className="gap-2 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {enCours ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : fiche ? (
              <RefreshCwIcon className="size-4" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            {enCours ? "Préparation…" : fiche ? "Régénérer la fiche" : "Générer la fiche"}
          </ShimmerButton>
          {!fiche && (
            <Button variant="ghost" onClick={() => enregistrer(true)} disabled={enCours}>
              Enregistrer sans fiche
            </Button>
          )}
        </div>
        {erreur && <p className="text-xs text-destructive">{erreur}</p>}
        {enCours && <BorderBeam size={120} duration={3} colorFrom={FX.vert} colorTo={FX.violet} />}
      </div>

      {fiche && (
        <>
          <FichePreparation p={fiche} />
          <Bloc titre="Et maintenant">
            <p className="text-sm text-muted-foreground">
              Enregistrez la fiche : elle sera proposée au démarrage du rendez-vous dans
              l'overlay, et C.A.P.R.I s'appuiera dessus pendant l'appel.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => enregistrer(true)}>
                <SaveIcon className="size-4" />
                Enregistrer pour mon prochain appel
              </Button>
              <Button variant="outline" onClick={() => enregistrer(false)}>
                Enregistrer seulement
              </Button>
            </div>
          </Bloc>
        </>
      )}
    </PageLayout>
  );
};

export default NouveauRdv;
