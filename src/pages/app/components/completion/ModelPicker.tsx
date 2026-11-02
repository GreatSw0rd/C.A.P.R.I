import { useEffect, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components";
import { useApp } from "@/contexts";
import { SparklesIcon, CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
import { TYPE_PROVIDER } from "@/types";
import { ouvrirTableauDeBord, safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";

// Modele memorise pour un fournisseur (variable "model"), pour l'afficher a cote du nom.
function modeleDe(id?: string, actif?: Record<string, string>): string {
  if (actif) return (actif.model || actif.MODEL || "").trim();
  try {
    const map = JSON.parse(safeLocalStorage.getItem(STORAGE_KEYS.PROVIDER_VARIABLES) || "{}");
    const v = id ? map[id] : null;
    return ((v?.model || v?.MODEL || "") as string).trim();
  } catch {
    return "";
  }
}

// Noms lisibles pour les fournisseurs connus (sinon on affiche l'id).
const NOMS: Record<string, string> = {
  "claude-cli": "Claude (CLI)",
  "gemini-cli": "Gemini (CLI)",
  "codex-cli": "Codex (CLI)",
  "qwen-cli": "Qwen (CLI)",
  ollama: "Ollama",
  lmstudio: "LM Studio",
  llamacpp: "llama.cpp",
  openai: "OpenAI",
  claude: "Claude (API)",
  grok: "Grok",
  gemini: "Gemini",
  mistral: "Mistral",
  cohere: "Cohere",
  groq: "Groq",
  perplexity: "Perplexity",
  openrouter: "OpenRouter",
};

export function nomFournisseur(p?: TYPE_PROVIDER): string {
  if (!p?.id) return "Choisir l'IA";
  if (NOMS[p.id]) return NOMS[p.id];
  if (p.isCustom) {
    if (p.name) return p.name;
    // Sans nom : domaine de l'adresse, pour distinguer plusieurs fournisseurs personnalises.
    const url = p.curl.match(/https?:\/\/([^/\s'"]+)/);
    return url ? url[1].replace(/^api\./, "") : "Personnalisé";
  }
  return p.id;
}

// Selecteur de fournisseur d'IA dans l'overlay : montre le LLM actif et permet d'en changer
// parmi les LLM ajoutes par l'utilisateur dans le tableau de bord.
export const ModelPicker = () => {
  const {
    allAiProviders,
    selectedAIProvider,
    switchAiProvider,
    configuredAiProviderIds,
  } = useApp();
  const [open, setOpen] = useState(false);

  const courant = allAiProviders.find(
    (p) => p.id === selectedAIProvider.provider
  );
  const liste = allAiProviders.filter(
    (p) => p.id && configuredAiProviderIds.includes(p.id)
  );

  // Si l'IA active n'est pas un LLM ajoute (ancienne IA integree), on passe au premier ajoute.
  const premierAjoute = liste[0]?.id;
  useEffect(() => {
    if (premierAjoute && !courant?.isCustom) switchAiProvider(premierAjoute);
  }, [premierAjoute, courant?.isCustom]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ov-pill max-w-[230px]"
          title="Fournisseur d'IA actif - cliquer pour changer"
        >
          <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {nomFournisseur(courant)}
            {modeleDe(undefined, selectedAIProvider.variables) && (
              <span className="opacity-60">
                {" · "}
                {modeleDe(undefined, selectedAIProvider.variables)}
              </span>
            )}
          </span>
          <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-64 p-1" sideOffset={8}>
        <div className="max-h-64 overflow-auto">
          {liste.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2">
              Aucun LLM ajouté. Ajoutez-en un dans le tableau de bord.
            </p>
          ) : (
            liste.map((p) => (
              <div
                key={p.id}
                className="group flex w-full items-center gap-1 rounded-md hover:bg-accent"
              >
                <button
                  onClick={() => {
                    if (p.id) switchAiProvider(p.id);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2 py-1.5 text-xs text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{nomFournisseur(p)}</span>
                    {modeleDe(
                      p.id,
                      p.id === selectedAIProvider.provider
                        ? selectedAIProvider.variables
                        : undefined
                    ) && (
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {modeleDe(
                          p.id,
                          p.id === selectedAIProvider.provider
                            ? selectedAIProvider.variables
                            : undefined
                        )}
                      </span>
                    )}
                  </span>
                  {p.id === selectedAIProvider.provider && (
                    <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => {
            setOpen(false);
            ouvrirTableauDeBord("/dev-space");
          }}
          className="mt-1 flex w-full items-center gap-2 rounded-md border-t px-2 py-1.5 text-xs hover:bg-accent text-left"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Ajouter un LLM
        </button>
      </PopoverContent>
    </Popover>
  );
};
