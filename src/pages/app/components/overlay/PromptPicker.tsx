import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components";
import { useSystemPrompts } from "@/hooks";
import { ouvrirTableauDeBord } from "@/lib";
import {
  WandSparklesIcon,
  ChevronDownIcon,
  CheckIcon,
  Settings2Icon,
  CircleOffIcon,
} from "lucide-react";

// Choix du prompt systeme actif (le "mode" de l'IA : general, entretien, SPIN...).
export const PromptPicker = () => {
  const {
    prompts,
    selectedPromptId,
    handleSelectPrompt,
    handleDeselectPrompt,
    hiddenPromptIds,
  } = useSystemPrompts();
  const [open, setOpen] = useState(false);

  const courant = prompts.find((p) => p.id === selectedPromptId);
  const libelle = courant ? courant.name : "Aucun prompt";
  // Seuls les prompts choisis dans le tableau de bord ("Dans l'outil") sont proposes.
  const visibles = prompts.filter((p) => !hiddenPromptIds.includes(p.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ov-pill max-w-[170px]"
          title="Prompt système actif : il définit le comportement de l'IA"
        >
          <WandSparklesIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{libelle}</span>
          <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-64 p-1" sideOffset={8}>
        <div className="max-h-64 overflow-auto">
          <button
            onClick={() => {
              handleDeselectPrompt();
              setOpen(false);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent text-left"
          >
            <span className="flex items-center gap-2 truncate text-muted-foreground">
              <CircleOffIcon className="h-3.5 w-3.5 shrink-0" />
              Désactivé (prompt par défaut)
            </span>
            {selectedPromptId === null && (
              <CheckIcon className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>
          {visibles.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">
              Aucun prompt affiché dans l'outil. Ajoutez-en un dans le tableau de bord, ou
              activez « Dans l'outil » sur un prompt existant.
            </p>
          )}
          {visibles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                handleSelectPrompt(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent text-left"
            >
              <span className="truncate">{p.name}</span>
              {p.id === selectedPromptId && (
                <CheckIcon className="h-3.5 w-3.5 shrink-0" />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setOpen(false);
            ouvrirTableauDeBord("/system-prompts");
          }}
          className="mt-1 flex w-full items-center gap-2 rounded-md border-t px-2 py-1.5 text-xs hover:bg-accent text-left"
        >
          <Settings2Icon className="h-3.5 w-3.5" />
          Gérer les prompts
        </button>
      </PopoverContent>
    </Popover>
  );
};
