import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Textarea,
} from "@/components";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/contexts";
import { fetchAIResponse } from "@/lib";

interface GenerateSystemPromptProps {
  onGenerate: (prompt: string, promptName: string) => void;
}

// Extraction tolerante d'un objet JSON dans la reponse du modele (meme entoure de texte ou de ```).
function extraireJson(texte: string): { prompt_name?: string; system_prompt?: string } | null {
  const debut = texte.indexOf("{");
  const fin = texte.lastIndexOf("}");
  if (debut === -1 || fin === -1 || fin <= debut) return null;
  try {
    return JSON.parse(texte.slice(debut, fin + 1));
  } catch {
    return null;
  }
}

/**
 * Genere une consigne systeme a partir d'une description, en utilisant le fournisseur d'IA
 * choisi par l'utilisateur (local, API ou Claude via CLI). Aucune dependance a un serveur distant.
 */
export const GenerateSystemPrompt = ({ onGenerate }: GenerateSystemPromptProps) => {
  const { allAiProviders, selectedAIProvider } = useApp();
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError("Décrivez ce que vous voulez");
      return;
    }
    const provider = allAiProviders.find(
      (p) => p.id === selectedAIProvider.provider
    );
    if (!provider) {
      setError("Choisissez d'abord un fournisseur d'IA dans « Fournisseurs d'IA ».");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const meta =
        `Tu génères une consigne système (system prompt) pour un assistant IA à partir de la ` +
        `description ci-dessous. Réponds UNIQUEMENT par un objet JSON valide, sans aucun texte ` +
        `autour, de la forme {"prompt_name": "...", "system_prompt": "..."}. "prompt_name" fait ` +
        `2 à 4 mots. "system_prompt" est la consigne complète, rédigée à la deuxième personne.\n\n` +
        `Description : """${userPrompt.trim()}"""`;

      let full = "";
      for await (const chunk of fetchAIResponse({
        provider,
        selectedProvider: selectedAIProvider,
        systemPrompt: undefined,
        userMessage: meta,
        imagesBase64: [],
      })) {
        full += chunk;
      }

      const parsed = extraireJson(full);
      if (parsed?.system_prompt && parsed?.prompt_name) {
        onGenerate(parsed.system_prompt, parsed.prompt_name);
        setIsOpen(false);
        setUserPrompt("");
      } else {
        setError("Réponse illisible du modèle. Réessayez ou reformulez.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Générer avec l'IA"
          size="sm"
          variant="outline"
          className="w-fit"
        >
          <SparklesIcon className="h-4 w-4" /> Générer avec l'IA
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-96 p-4 border shadow-lg"
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">Générer une consigne système</p>
            <p className="text-xs text-muted-foreground">
              Décrivez le comportement souhaité ; votre fournisseur d'IA génère la consigne.
            </p>
          </div>

          <Textarea
            placeholder="ex. : un assistant qui m'aide en rendez-vous commercial et propose des réponses aux objections..."
            className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
            value={userPrompt}
            onChange={(e) => {
              setUserPrompt(e.target.value);
              setError(null);
            }}
            disabled={isGenerating}
          />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={!userPrompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <SparklesIcon className="h-4 w-4 animate-pulse" />
                Génération...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                Générer
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
