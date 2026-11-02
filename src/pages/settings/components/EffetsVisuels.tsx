import { motion } from "motion/react";
import { Header } from "@/components";
import { NiveauEffets, useEffetsVisuels } from "@/hooks/useEffets";
import { cn } from "@/lib/utils";

const NIVEAUX: { id: NiveauEffets; label: string; detail: string }[] = [
  {
    id: "complet",
    label: "Complets",
    detail: "Fonds animés propres à chaque page, iris phosphore et transitions.",
  },
  {
    id: "leger",
    label: "Légers",
    detail: "Motifs fixes, halo simple et transitions simples. Idéal sur un PC peu puissant.",
  },
  {
    id: "aucun",
    label: "Aucun",
    detail: "Fond uni, sans animation. Le plus économe.",
  },
];

// Choix du niveau d'effets visuels du tableau de bord (fluidite vs. effets).
export const EffetsVisuels = () => {
  const [niveau, setNiveau] = useEffetsVisuels();

  return (
    <div id="effets" className="space-y-4">
      <Header
        title="Effets visuels"
        description="Réglez l'équilibre entre effets et fluidité. Les fonds animés se mettent en pause quand la fenêtre est cachée."
        isMainTitle
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {NIVEAUX.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setNiveau(n.id)}
            className={cn(
              "relative rounded-xl border p-3 text-left transition-colors",
              niveau === n.id
                ? "border-primary/50"
                : "border-border hover:border-primary/30"
            )}
          >
            {niveau === n.id && (
              <motion.span
                layoutId="choix-effets"
                className="absolute inset-0 rounded-xl bg-primary/10"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative block text-sm font-medium">{n.label}</span>
            <span className="relative mt-1 block text-xs text-muted-foreground">
              {n.detail}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
