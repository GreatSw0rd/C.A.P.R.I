import { useState } from "react";
import { ZapIcon, FileTextIcon } from "lucide-react";
import { useApp } from "@/contexts";
import { definirModeleUsage, lireModeleUsage, type UsageIA } from "@/lib";
import { nomFournisseur } from "@/pages/app/components/completion/ModelPicker";

const USAGES: { id: UsageIA; titre: string; aide: string; Icone: React.ElementType }[] = [
  {
    id: "direct",
    titre: "Pendant l'appel",
    aide: "La vitesse compte : une suggestion doit arriver en quelques secondes (ex. Groq).",
    Icone: ZapIcon,
  },
  {
    id: "synthese",
    titre: "Préparation et compte-rendu",
    aide: "La qualité compte : le temps de réponse importe peu (ex. Claude CLI).",
    Icone: FileTextIcon,
  },
];

// Choix du modele selon l'usage, parmi les fournisseurs configures.
export const ReglagesCopilote = () => {
  const { allAiProviders, configuredAiProviderIds, selectedAIProvider } = useApp();
  const [choix, setChoix] = useState<Record<UsageIA, string>>({
    direct: lireModeleUsage("direct"),
    synthese: lireModeleUsage("synthese"),
  });
  const options = allAiProviders.filter((p) => p.id && configuredAiProviderIds.includes(p.id));
  const actif = allAiProviders.find((p) => p.id === selectedAIProvider.provider);

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card/70 p-4 md:grid-cols-2">
      {USAGES.map((u) => (
        <label key={u.id} className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <u.Icone className="size-3.5 text-primary" />
            IA {u.titre.toLowerCase()}
          </span>
          <select
            value={choix[u.id]}
            onChange={(e) => {
              definirModeleUsage(u.id, e.target.value);
              setChoix((c) => ({ ...c, [u.id]: e.target.value }));
            }}
            className="h-9 w-full rounded-lg border border-input bg-background/60 px-3 text-sm outline-none focus:border-primary/60"
          >
            <option value="">Fournisseur actif ({nomFournisseur(actif)})</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {nomFournisseur(p)}
              </option>
            ))}
          </select>
          <span className="block text-[11px] text-muted-foreground">{u.aide}</span>
        </label>
      ))}
    </div>
  );
};
