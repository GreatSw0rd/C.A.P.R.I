import { AnimatePresence, motion } from "motion/react";
import type { Fait } from "@/lib";
import type { NoteRecente } from "@/hooks/useSuiviRdv";

export const COULEUR_STATUT: Record<Fait["statut"], string> = {
  confirme: "var(--ov-ok)",
  a_confirmer: "160 158 175",
  a_clarifier: "var(--ov-warn)",
};

// Etiquettes "Note" : ce que C.A.P.R.I vient de retenir, en un coup d'oeil, puis elles
// s'effacent. Le commercial sait que c'est capte sans avoir a lire.
const COULEUR_NOTE: Record<NoteRecente["ton"], string> = {
  ...COULEUR_STATUT,
  engagement: "var(--ov-accent)",
};

export const NotesRecentes = ({ notes }: { notes: NoteRecente[] }) => (
  <div className="flex h-7 items-center gap-1.5 overflow-hidden">
    <AnimatePresence initial={false}>
      {notes.map((n) => (
        <motion.span
          key={n.cle}
          layout
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="flex max-w-[260px] shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
          style={{ background: "rgb(var(--ov-surface))" }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: `rgb(${COULEUR_NOTE[n.ton]})` }}
          />
          <span className="ov-muted shrink-0">{n.libelle}</span>
          <span className="truncate">{n.valeur}</span>
        </motion.span>
      ))}
    </AnimatePresence>
  </div>
);
