import { useState } from "react";
import { Card, Button, Markdown, Header } from "@/components";
import { useApp } from "@/contexts";
import { fetchAIResponse } from "@/lib";
import { ChatMessage } from "@/types";
import { FileTextIcon, ListChecksIcon, FlagIcon, LanguagesIcon } from "lucide-react";

type TacheRecap = "resume" | "decisions" | "actions" | "traduction";

const TACHES: {
  id: TacheRecap;
  label: string;
  icon: React.ElementType;
  consigne: string;
}[] = [
  {
    id: "resume",
    label: "Résumé",
    icon: FileTextIcon,
    consigne:
      "Résume l'échange suivant en quelques points clairs et brefs. N'ajoute aucune information non dite.",
  },
  {
    id: "decisions",
    label: "Décisions",
    icon: FlagIcon,
    consigne:
      "Liste uniquement les décisions prises dans l'échange suivant. S'il n'y en a pas, dis-le.",
  },
  {
    id: "actions",
    label: "Actions",
    icon: ListChecksIcon,
    consigne:
      "Liste les actions à faire issues de l'échange suivant, au format : qui / quoi / quand. " +
      "Si une information manque, écris « à préciser ».",
  },
  {
    id: "traduction",
    label: "Traduire en anglais",
    icon: LanguagesIcon,
    consigne:
      "Traduis fidèlement en anglais le résumé de l'échange suivant, en points brefs.",
  },
];

function transcription(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "Interlocuteur" : "Assistant"} : ${m.content}`)
    .join("\n");
}

export const Recap = ({ messages }: { messages: ChatMessage[] }) => {
  const { allAiProviders, selectedAIProvider } = useApp();
  const [active, setActive] = useState<TacheRecap | null>(null);
  const [sortie, setSortie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const lancer = async (tache: (typeof TACHES)[number]) => {
    const provider = allAiProviders.find(
      (p) => p.id === selectedAIProvider.provider
    );
    if (!provider) {
      setErreur("Choisissez d'abord un fournisseur d'IA dans « Fournisseurs d'IA ».");
      return;
    }
    const texte = transcription(messages);
    if (!texte.trim()) {
      setErreur("Aucun contenu à traiter.");
      return;
    }

    setActive(tache.id);
    setErreur(null);
    setSortie("");
    try {
      const message = `${tache.consigne}\n\nÉchange :\n"""\n${texte}\n"""`;
      for await (const chunk of fetchAIResponse({
        provider,
        selectedProvider: selectedAIProvider,
        systemPrompt: undefined,
        userMessage: message,
        imagesBase64: [],
      })) {
        setSortie((prev) => prev + chunk);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setActive(null);
    }
  };

  return (
    <div className="space-y-2">
      <Header
        title="Récap"
        description="Transforme la conversation en résumé, décisions, actions ou traduction, via votre fournisseur d'IA."
      />
      <div className="flex flex-wrap gap-2">
        {TACHES.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant="outline"
            disabled={active !== null}
            onClick={() => lancer(t)}
          >
            <t.icon className="h-4 w-4" />
            {active === t.id ? "..." : t.label}
          </Button>
        ))}
      </div>
      {erreur && <p className="text-xs text-destructive">{erreur}</p>}
      {sortie && (
        <Card className="p-3 shadow-none border border-border/70 rounded-xl">
          <Markdown>{sortie}</Markdown>
        </Card>
      )}
    </div>
  );
};
