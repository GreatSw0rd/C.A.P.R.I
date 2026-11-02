import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CLES_QUALIF,
  ETAPES_SPIN,
  NOMS_QUALIF,
  NOMS_SPIN,
  spinDe,
  qualifDe,
  type RendezVous,
} from "@/lib";
import { InterrupteurAssistant } from "./InterrupteurAssistant";

const chrono = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

/** Etape SPIN a travailler en priorite (premiere non couverte). */
export const prochaineEtape = (rdv: RendezVous) => {
  const spin = spinDe(rdv.suivi);
  return ETAPES_SPIN.find((e) => spin[e].length === 0) ?? null;
};

// Bandeau fin en haut du rendez-vous : duree, interlocuteur, avancement SPIN et
// qualification. Lisible d'un coup d'oeil, sans detourner l'attention.
export const BandeauRdv = ({
  rdv,
  onTerminer,
  desactive,
  assistant,
  onAssistant,
}: {
  rdv: RendezVous;
  onTerminer: () => void;
  desactive?: boolean;
  assistant: boolean;
  onAssistant: (actif: boolean) => void;
}) => {
  const [maintenant, setMaintenant] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const spin = spinDe(rdv.suivi);
  const qualif = qualifDe(rdv.suivi);
  const prochaine = prochaineEtape(rdv);
  const nbQualif = CLES_QUALIF.filter((c) => qualif?.[c]).length;
  const nom = rdv.entreprise || rdv.preparation?.entreprise || "Rendez-vous";

  return (
    <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b ov-divider select-none">
      <span className="flex items-center gap-1.5 text-xs tabular-nums">
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: "rgb(var(--ov-live))" }}
        />
        {chrono(maintenant - (rdv.debut || maintenant))}
      </span>
      <span className="truncate text-xs font-medium max-w-[140px]">{nom}</span>

      <span className="h-4 border-l ov-divider" />

      {/* SPIN : etapes couvertes allumees, prochaine etape soulignee */}
      <div className="flex items-center gap-1" title="Avancement SPIN">
        {ETAPES_SPIN.map((e) => {
          const fait = (spin?.[e].length ?? 0) > 0;
          return (
            <span
              key={e}
              title={`${NOMS_SPIN[e]}${fait ? " : couvert" : ""}`}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold transition-colors",
                fait
                  ? "text-[rgb(20_24_18)]"
                  : e === prochaine
                  ? "ring-1 ring-[rgb(var(--ov-accent))] ov-muted"
                  : "ov-muted"
              )}
              style={{
                background: fait
                  ? "rgb(var(--ov-accent))"
                  : "rgb(var(--ov-surface))",
              }}
            >
              {e}
            </span>
          );
        })}
      </div>

      {/* Qualification : 4 points (budget, decideur, besoin, delai) */}
      <div
        className="flex items-center gap-1.5"
        title={CLES_QUALIF.map(
          (c) => `${NOMS_QUALIF[c]} : ${qualif?.[c] || "à découvrir"}`
        ).join("\n")}
      >
        <span className="text-[10px] ov-muted">Qualif.</span>
        <div className="flex gap-0.5">
          {CLES_QUALIF.map((c) => (
            <span
              key={c}
              className="h-1.5 w-3 rounded-full"
              style={{
                background: qualif?.[c]
                  ? "rgb(var(--ov-ok))"
                  : "rgb(var(--ov-surface-hover))",
              }}
            />
          ))}
        </div>
        <span className="text-[10px] tabular-nums ov-muted">{nbQualif}/4</span>
      </div>

      <div className="flex-1" />
      <InterrupteurAssistant actif={assistant} onChange={onAssistant} compact />
      <button
        type="button"
        className="ov-pill !h-7"
        onClick={onTerminer}
        disabled={desactive}
      >
        Terminer
      </button>
    </div>
  );
};
