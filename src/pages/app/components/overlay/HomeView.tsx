import { useEffect, useState } from "react";
import {
  MessageSquareIcon,
  HeadphonesIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { ScrollArea } from "@/components";
import { useApp } from "@/contexts";
import { getAllKnowledge, ouvrirTableauDeBord, safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";
import { nomFournisseur } from "../completion/ModelPicker";
import { raccourci } from "./raccourcis";

type Ligne = {
  titre: string;
  valeur: string;
  ok: boolean;
  chemin: string;
};

// Accueil de l'overlay : etat de la configuration, explications et raccourcis.
export const HomeView = ({
  onAsk,
  onListen,
}: {
  onAsk: () => void;
  onListen: () => void;
}) => {
  const {
    allAiProviders,
    selectedAIProvider,
    allSttProviders,
    selectedSttProvider,
    systemPrompt,
  } = useApp();
  const [connaissances, setConnaissances] = useState<number | null>(null);
  const [ongletDefaut, setOngletDefaut] = useState<string>(
    safeLocalStorage.getItem(STORAGE_KEYS.OVERLAY_DEFAULT_TAB) || "ask"
  );

  useEffect(() => {
    getAllKnowledge()
      .then((docs) => setConnaissances(docs.filter((d) => d.enabled).length))
      .catch(() => setConnaissances(null));
  }, []);

  const ia = allAiProviders.find((p) => p.id === selectedAIProvider.provider);
  const stt = allSttProviders.find((p) => p.id === selectedSttProvider.provider);
  const nomStt = stt
    ? ((stt as unknown as { name?: string }).name ?? stt.id ?? "")
    : "";

  const lignes: Ligne[] = [
    {
      titre: "Fournisseur d'IA (réponses)",
      valeur: ia ? nomFournisseur(ia) : "À configurer",
      ok: !!ia,
      chemin: "/dev-space",
    },
    {
      titre: "Transcription (STT) pour l'écoute et la dictée",
      valeur: stt ? nomStt : "À configurer",
      ok: !!stt,
      chemin: "/dev-space",
    },
    {
      titre: "Prompt système (comportement de l'IA)",
      valeur: systemPrompt ? systemPrompt.slice(0, 60) + (systemPrompt.length > 60 ? "…" : "") : "Par défaut",
      ok: true,
      chemin: "/system-prompts",
    },
    {
      titre: "Connaissances (offre, objections…)",
      valeur:
        connaissances === null
          ? "—"
          : connaissances === 0
          ? "Aucune active"
          : `${connaissances} document(s) actif(s)`,
      ok: (connaissances ?? 0) > 0,
      chemin: "/knowledge",
    },
  ];

  const raccourcisListe: [string, string][] = [
    ["Afficher / masquer C.A.P.R.I", "toggle_window"],
    ["Ouvrir le tableau de bord", "toggle_dashboard"],
    ["Démarrer / arrêter l'écoute", "system_audio"],
    ["Capture d'écran", "screenshot"],
    ["Dicter une question", "audio_recording"],
    ["Revenir à la saisie", "focus_input"],
  ];

  const choisirOnglet = (v: string) => {
    setOngletDefaut(v);
    safeLocalStorage.setItem(STORAGE_KEYS.OVERLAY_DEFAULT_TAB, v);
  };

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="ov-input p-3 text-left hover:opacity-90"
            onClick={onAsk}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareIcon className="h-4 w-4" /> Demander
            </div>
            <p className="text-xs ov-muted mt-1">
              Vous posez une question (texte, voix ou capture d'écran).
            </p>
          </button>
          <button
            type="button"
            className="ov-input p-3 text-left hover:opacity-90"
            onClick={onListen}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HeadphonesIcon className="h-4 w-4" /> Écouter
            </div>
            <p className="text-xs ov-muted mt-1">
              C.A.P.R.I entend votre interlocuteur (son de l'ordinateur) et vous
              souffle des réponses.
            </p>
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider ov-muted">
            CONFIGURATION
          </p>
          {lignes.map((l) => (
            <button
              key={l.titre}
              type="button"
              onClick={() => ouvrirTableauDeBord(l.chemin)}
              className="ov-input flex w-full items-center gap-2 px-3 py-2 text-left hover:opacity-90"
            >
              {l.ok ? (
                <CheckCircle2Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: "rgb(var(--ov-ok))" }}
                />
              ) : (
                <AlertCircleIcon
                  className="h-4 w-4 shrink-0"
                  style={{ color: "rgb(var(--ov-warn))" }}
                />
              )}
              <span className="text-xs flex-1 min-w-0">
                <span className="block font-medium">{l.titre}</span>
                <span className="block ov-muted truncate">{l.valeur}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider ov-muted">
            RACCOURCIS
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {raccourcisListe.map(([libelle, id]) => {
              const touche = raccourci(id);
              return (
                <div key={id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="ov-muted truncate">{libelle}</span>
                  <span className="ov-kbd shrink-0">{touche ?? "—"}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="ov-muted">Ouvrir l'overlay sur :</span>
          <div className="ov-group">
            {[
              ["ask", "Demander"],
              ["listen", "Écouter"],
              ["home", "Accueil"],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                className="ov-pill"
                data-active={ongletDefaut === v}
                onClick={() => choisirOnglet(v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
