import { cn } from "@/lib/utils";

// "Assistant : oui / non". Sans assistant, C.A.P.R.I ecoute, tient la fiche et redige le
// compte-rendu, mais n'affiche aucune suggestion pendant l'appel.
export const InterrupteurAssistant = ({
  actif,
  onChange,
  compact,
}: {
  actif: boolean;
  onChange: (actif: boolean) => void;
  compact?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={actif}
    onClick={() => onChange(!actif)}
    title={
      actif
        ? "Assistant activé : C.A.P.R.I vous souffle questions et parades"
        : "Assistant désactivé : prise de notes et compte-rendu seulement"
    }
    className={cn("flex shrink-0 items-center gap-1.5 select-none", compact ? "text-[11px]" : "text-xs")}
  >
    <span className="ov-muted">Assistant</span>
    <span
      className="relative h-4 w-7 shrink-0 rounded-full transition-colors"
      style={{ background: actif ? "rgb(var(--ov-accent))" : "rgb(var(--ov-surface-hover))" }}
    >
      <span
        className={cn(
          "absolute left-0 top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
          actif ? "translate-x-3.5" : "translate-x-0.5"
        )}
      />
    </span>
    <span className={cn("w-6 text-left font-medium", !actif && "ov-muted")}>{actif ? "oui" : "non"}</span>
  </button>
);
