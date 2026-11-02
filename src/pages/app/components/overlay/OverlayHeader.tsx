import {
  MessageSquareIcon,
  HeadphonesIcon,
  HistoryIcon,
  SettingsIcon,
} from "lucide-react";
import { DragButton } from "@/components";
import { OrbeCapri } from "@/components/fx/OrbeCapri";
import { useApp } from "@/contexts";
import { ouvrirTableauDeBord } from "@/lib";

export type OverlayView = "home" | "ask" | "listen";

// En-tete de l'overlay : accueil, onglets Demander / Ecouter, etat, acces rapides.
export const OverlayHeader = ({
  view,
  setView,
  capturing,
}: {
  view: OverlayView;
  setView: (v: OverlayView) => void;
  capturing: boolean;
}) => {
  const { selectedAIProvider } = useApp();

  const statut = capturing
    ? { libelle: "Écoute…", couleur: "rgb(var(--ov-live))", pulse: true }
    : !selectedAIProvider.provider
    ? { libelle: "À configurer", couleur: "rgb(var(--ov-warn))", pulse: false }
    : { libelle: "Prêt", couleur: "rgb(var(--ov-ok))", pulse: false };

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 py-2 border-b ov-divider"
      data-tauri-drag-region
    >
      <button
        type="button"
        className="ov-icon"
        data-active={view === "home"}
        title="Accueil"
        onClick={() => setView("home")}
      >
        <OrbeCapri className="size-8" interactive={false} />
      </button>
      <span
        className="text-sm font-semibold select-none"
        data-tauri-drag-region
      >
        C.A.P.R.I
      </span>
      <span className="h-5 border-l ov-divider" />

      <div className="ov-group">
        <button
          type="button"
          className="ov-pill"
          data-active={view === "ask"}
          title="Ask : posez vos questions (texte, voix, capture)"
          onClick={() => setView("ask")}
        >
          <MessageSquareIcon className="h-4 w-4" />
          Demander
        </button>
        <button
          type="button"
          className="ov-pill"
          data-active={view === "listen"}
          title="Listen : C.A.P.R.I écoute votre interlocuteur et vous souffle des réponses"
          onClick={() => setView("listen")}
        >
          <HeadphonesIcon className="h-4 w-4" />
          Écouter
        </button>
      </div>

      <div className="flex-1 self-stretch" data-tauri-drag-region />

      <span
        className="ov-pill select-none"
        style={{ cursor: "default" }}
        title="État de C.A.P.R.I"
      >
        <span
          className={`h-2 w-2 rounded-full ${statut.pulse ? "animate-pulse" : ""}`}
          style={{ backgroundColor: statut.couleur }}
        />
        {statut.libelle}
      </span>

      <button
        type="button"
        className="ov-icon"
        title="Historique (bibliothèque)"
        onClick={() => ouvrirTableauDeBord("/rendez-vous")}
      >
        <HistoryIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="ov-icon"
        title="Réglages"
        onClick={() => ouvrirTableauDeBord("/settings")}
      >
        <SettingsIcon className="h-4 w-4" />
      </button>
      <DragButton />
    </div>
  );
};
