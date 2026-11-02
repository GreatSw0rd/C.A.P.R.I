import { useState } from "react";
import { Button } from "@/components";
import { useApp } from "@/contexts";
import { fetchAIResponse } from "@/lib";
import { ChatMessage } from "@/types";
import { SparklesIcon } from "lucide-react";

// Extraction tolerante d'un tableau JSON de chaines dans la reponse du modele.
function extraireListe(texte: string): string[] {
  const debut = texte.indexOf("[");
  const fin = texte.lastIndexOf("]");
  if (debut === -1 || fin === -1 || fin <= debut) return [];
  try {
    const arr = JSON.parse(texte.slice(debut, fin + 1));
    if (Array.isArray(arr)) {
      return arr.filter((x) => typeof x === "string").slice(0, 3);
    }
  } catch {
    /* ignore */
  }
  return [];
}

function transcription(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role !== "system")
    .slice(0, 12)
    .map((m) => `${m.role === "user" ? "Interlocuteur" : "Assistant"} : ${m.content}`)
    .join("\n");
}

/**
 * Propose des questions de relance a partir de la conversation, via le fournisseur d'IA choisi.
 * Cliquer sur une suggestion l'envoie directement.
 */
export const FollowUps = ({
  messages,
  onPick,
}: {
  messages: ChatMessage[];
  onPick: (question: string) => void;
}) => {
  const { allAiProviders, selectedAIProvider } = useApp();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const generer = async () => {
    const provider = allAiProviders.find(
      (p) => p.id === selectedAIProvider.provider
    );
    if (!provider) {
      setErreur("Choisissez d'abord un fournisseur d'IA.");
      return;
    }
    const texte = transcription(messages);
    if (!texte.trim()) return;

    setChargement(true);
    setErreur(null);
    setSuggestions([]);
    try {
      const message =
        `À partir de l'échange suivant, propose 3 questions de relance courtes et pertinentes ` +
        `que l'utilisateur pourrait poser ensuite. Réponds UNIQUEMENT par un tableau JSON de 3 ` +
        `chaînes, sans texte autour.\n\nÉchange :\n"""\n${texte}\n"""`;
      let full = "";
      for await (const chunk of fetchAIResponse({
        provider,
        selectedProvider: selectedAIProvider,
        systemPrompt: undefined,
        userMessage: message,
        imagesBase64: [],
      })) {
        full += chunk;
      }
      const liste = extraireListe(full);
      if (liste.length === 0) {
        setErreur("Aucune suggestion exploitable.");
      } else {
        setSuggestions(liste);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={chargement} onClick={generer}>
          <SparklesIcon className="h-4 w-4" />
          {chargement ? "..." : "Suggestions de relance"}
        </Button>
        {suggestions.map((s, i) => (
          <Button
            key={i}
            size="sm"
            variant="secondary"
            className="whitespace-normal text-left h-auto py-1"
            onClick={() => onPick(s)}
          >
            {s}
          </Button>
        ))}
      </div>
      {erreur && <p className="text-xs text-destructive">{erreur}</p>}
    </div>
  );
};
