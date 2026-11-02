import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ShieldAlertIcon,
  MessageCircleQuestionIcon,
  ZapIcon,
  ScaleIcon,
  ChevronDownIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Carte, TypeCarte } from "@/lib";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import type { RetourPassage } from "@/hooks/useSuiviRdv";

export const STYLE_CARTE: Record<
  TypeCarte,
  { libelle: string; couleur: string; Icone: React.ElementType }
> = {
  objection: { libelle: "Objection", couleur: "251 191 36", Icone: ShieldAlertIcon },
  clarifier: { libelle: "À clarifier", couleur: "125 211 252", Icone: ScaleIcon },
  signal: { libelle: "Signal clé", couleur: "110 231 183", Icone: ZapIcon },
  question: { libelle: "Question à poser", couleur: "196 234 170", Icone: MessageCircleQuestionIcon },
};

const MESSAGES: Record<Exclude<RetourPassage, null>, string> = {
  rien: "Passage écouté · rien de nouveau à signaler, continuez.",
  calme: "Noté dans la fiche · la prochaine suggestion attendra un instant.",
  inaudible: "Passage inaudible ou vide · recaptez quand l'interlocuteur parle.",
};

const ilYa = (heure: number, now: number) => {
  const s = Math.max(0, Math.round((now - heure) / 1000));
  if (s < 60) return `il y a ${s} s`;
  return `il y a ${Math.round(s / 60)} min`;
};

/** Ligne d'etat au-dessus de la carte (analyse en cours ou retour discret). */
export const LigneEtat = ({ enAnalyse, retour }: { enAnalyse: boolean; retour: RetourPassage }) => (
  <div className="flex h-4 items-center">
    {enAnalyse ? (
      <AnimatedShinyText className="mx-0 text-[11px] text-white/50 [--shiny-width:70px]">
        Analyse du passage…
      </AnimatedShinyText>
    ) : retour ? (
      <motion.span
        key={retour}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] ov-muted"
      >
        {MESSAGES[retour]}
      </motion.span>
    ) : null}
  </div>
);

// Une seule suggestion a la fois, en grand : ce qu'il faut dire maintenant.
// "Fait" et "Pas pertinent" alimentent le suivi ; les precedentes restent repliees.
export const CarteDuMoment = ({
  cartes,
  enAnalyse,
  onRetour,
}: {
  cartes: Carte[];
  enAnalyse: boolean;
  onRetour: (id: string, retour: "faite" | "ecartee") => void;
}) => {
  const [now, setNow] = useState(Date.now());
  const [voirAnciennes, setVoirAnciennes] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const visibles = cartes.filter((c) => c.statut !== "ecartee");
  const carte = visibles[visibles.length - 1];
  const anciennes = visibles.slice(0, -1).reverse();
  const faite = carte?.statut === "faite";

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {carte ? (
          <motion.div
            key={carte.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: enAnalyse ? 0.55 : faite ? 0.6 : 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="ov-input relative overflow-hidden p-4"
            style={{ boxShadow: `inset 3px 0 0 rgb(${STYLE_CARTE[carte.type].couleur})` }}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
              {(() => {
                const { Icone, libelle, couleur } = STYLE_CARTE[carte.type];
                return (
                  <span className="flex items-center gap-1.5" style={{ color: `rgb(${couleur})` }}>
                    <Icone className="h-3.5 w-3.5" />
                    {libelle}
                  </span>
                );
              })()}
              <span className="truncate ov-muted normal-case font-normal tracking-normal">
                · {carte.titre}
              </span>
              <span className="flex-1" />
              <span className="shrink-0 ov-muted normal-case font-normal tracking-normal">
                {ilYa(carte.heure, now)}
              </span>
            </div>

            {carte.note && (
              <p className="mt-1.5 text-[11px] font-medium" style={{ color: `rgb(${STYLE_CARTE[carte.type].couleur})` }}>
                {carte.note}
              </p>
            )}

            {carte.dire && (
              <p className="mt-2.5 text-[17px] leading-snug font-medium">{carte.dire}</p>
            )}

            {carte.questions.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {carte.questions.map((q) => (
                  <li key={q} className="flex gap-2 text-sm leading-snug">
                    <span style={{ color: `rgb(${STYLE_CARTE.question.couleur})` }}>›</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex items-center gap-2">
              {faite ? (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: "rgb(var(--ov-ok))" }}>
                  <CheckIcon className="h-3.5 w-3.5" /> Fait
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className="ov-chip !h-7"
                    onClick={() => onRetour(carte.id, "faite")}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    Fait
                  </button>
                  <button
                    type="button"
                    className="ov-chip !h-7 ov-muted"
                    onClick={() => onRetour(carte.id, "ecartee")}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                    Pas pertinent
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {anciennes.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setVoirAnciennes((v) => !v)}
            className="flex items-center gap-1 text-[11px] ov-muted hover:opacity-80"
          >
            <ChevronDownIcon
              className={cn("h-3 w-3 transition-transform", voirAnciennes && "rotate-180")}
            />
            Plus tôt ({anciennes.length})
          </button>
          {voirAnciennes && (
            <div className="mt-1.5 space-y-1">
              {anciennes.map((c) => (
                <div
                  key={c.id}
                  className="rounded-md px-2.5 py-1.5 text-xs"
                  style={{ background: "rgb(var(--ov-surface))" }}
                >
                  <span className="font-medium" style={{ color: `rgb(${STYLE_CARTE[c.type].couleur})` }}>
                    {STYLE_CARTE[c.type].libelle}
                  </span>
                  <span className="ov-muted"> · {c.titre}</span>
                  {c.statut === "faite" && <span className="ov-muted"> · fait</span>}
                  {c.dire && <p className="mt-0.5 leading-snug">{c.dire}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
