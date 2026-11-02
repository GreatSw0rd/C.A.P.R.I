import { useEffect, useState } from "react";
import { PlayIcon, FileTextIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listerRendezVous,
  ouvrirTableauDeBord,
  safeLocalStorage,
  type RendezVous,
} from "@/lib";
import { STORAGE_KEYS } from "@/config";
import { OrbeCapri } from "@/components/fx/OrbeCapri";
import { useApp } from "@/contexts";
import { lireModeleUsage } from "@/lib";
import { nomFournisseur } from "../../completion/ModelPicker";
import { InterrupteurAssistant } from "./InterrupteurAssistant";

// Avant le rendez-vous : choisir sa preparation (facultatif) et demarrer.
export const AvantRdv = ({
  onDemarrer,
  touche,
  assistant,
  onAssistant,
}: {
  onDemarrer: (idPreparation: string | null) => void;
  touche: string | null;
  assistant: boolean;
  onAssistant: (actif: boolean) => void;
}) => {
  const [preparations, setPreparations] = useState<RendezVous[]>([]);
  const { allAiProviders, selectedAIProvider } = useApp();
  const nomPour = (usage: "direct" | "synthese") =>
    nomFournisseur(
      allAiProviders.find((p) => p.id === (lireModeleUsage(usage) || selectedAIProvider.provider))
    );
  const [choix, setChoix] = useState<string | null>(
    safeLocalStorage.getItem(STORAGE_KEYS.RDV_PREPARE_ACTIF)
  );

  useEffect(() => {
    const charger = () =>
      listerRendezVous()
        .then((l) => setPreparations(l.filter((r) => r.statut === "prepare")))
        .catch(() => setPreparations([]));
    charger();
    window.addEventListener("focus", charger);
    return () => window.removeEventListener("focus", charger);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-4 text-center select-none">
      <OrbeCapri className="size-24 -my-2" />
      <div>
        <p className="text-base font-semibold">Prêt pour votre rendez-vous ?</p>
        <p className="mt-0.5 text-xs ov-muted">
          Captez ce que dit votre interlocuteur : C.A.P.R.I ne vous souffle que l'utile.
        </p>
      </div>

      <div className="w-full max-w-md space-y-1.5 text-left">
        <p className="text-[10px] font-semibold tracking-wider ov-muted">PRÉPARATION</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="ov-chip"
            data-active={choix === null}
            onClick={() => setChoix(null)}
          >
            Sans préparation
          </button>
          {preparations.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn("ov-chip max-w-[200px]")}
              data-active={choix === p.id}
              onClick={() => setChoix(p.id)}
            >
              <FileTextIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{p.entreprise || p.titre}</span>
            </button>
          ))}
          <button
            type="button"
            className="ov-chip"
            onClick={() => ouvrirTableauDeBord("/rendez-vous/nouveau")}
          >
            <PlusIcon className="h-3 w-3" />
            Préparer
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDemarrer(choix)}
        className="mt-1 flex h-11 w-full max-w-md items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-transform active:scale-[0.98]"
        style={{ background: "rgb(var(--ov-accent))", color: "rgb(20 24 18)" }}
      >
        <PlayIcon className="h-4 w-4" />
        Démarrer le rendez-vous
        {touche && <span className="ov-kbd !bg-black/15 !text-[rgb(20_24_18)]">{touche}</span>}
      </button>

      <div className="flex flex-col items-center gap-0.5">
        <InterrupteurAssistant actif={assistant} onChange={onAssistant} />
        <p className="text-[10px] ov-muted">
          {assistant
            ? "Questions, parades et signaux pendant l'appel."
            : "Prise de notes et compte-rendu seulement, aucune suggestion."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => ouvrirTableauDeBord("/rendez-vous")}
        className="text-[11px] ov-muted hover:opacity-80"
      >
        IA pendant l'appel : <b className="font-semibold">{nomPour("direct")}</b> · compte-rendu :{" "}
        <b className="font-semibold">{nomPour("synthese")}</b>
      </button>

      <ol className="w-full max-w-md space-y-1 text-left text-[11px] ov-muted">
        <li>1. Démarrez au début de l'appel.</li>
        <li>
          2. Quand l'interlocuteur parle, appuyez sur {touche || "le bouton"} pour capter, puis
          à nouveau pour envoyer. Ça marche même depuis Teams ou Zoom.
        </li>
        <li>
          3.{" "}
          {assistant
            ? "Une carte n'apparaît que si c'est utile : question ouverte, parade, signal."
            : "C.A.P.R.I note tout, y compris les engagements, sans vous interrompre."}
        </li>
      </ol>
    </div>
  );
};
