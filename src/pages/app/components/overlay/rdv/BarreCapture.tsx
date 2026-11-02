import { MicIcon, SendIcon, XIcon, Loader2 } from "lucide-react";

const duree = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Un seul geste : capter ce que dit l'interlocuteur, puis envoyer. Le raccourci global
// fonctionne aussi quand la fenetre de visio est au premier plan.
export const BarreCapture = ({
  enregistre,
  occupe,
  progression,
  touche,
  onCapter,
  onEnvoyer,
  onAnnuler,
}: {
  enregistre: boolean;
  occupe: boolean;
  progression: number;
  touche: string | null;
  onCapter: () => void;
  onEnvoyer: () => void;
  onAnnuler: () => void;
}) => (
  <div className="shrink-0 px-3 pb-2 pt-1">
    {enregistre ? (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEnvoyer}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          style={{ background: "rgb(var(--ov-live))" }}
        >
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          J'écoute · {duree(progression)} — Envoyer
          <SendIcon className="h-4 w-4" />
          {touche && <span className="ov-kbd !bg-white/20 !text-white">{touche}</span>}
        </button>
        <button type="button" className="ov-pill !h-11" onClick={onAnnuler}>
          <XIcon className="h-4 w-4" />
          Annuler
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onCapter}
        disabled={occupe}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: "rgb(var(--ov-accent))", color: "rgb(20 24 18)" }}
      >
        {occupe ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…
          </>
        ) : (
          <>
            <MicIcon className="h-4 w-4" />
            Capter ce que dit l'interlocuteur
            {touche && <span className="ov-kbd !bg-black/15 !text-[rgb(20_24_18)]">{touche}</span>}
          </>
        )}
      </button>
    )}
  </div>
);
