import { Card, Button, Header } from "@/components";
import { PlusIcon, CheckIcon } from "lucide-react";

// Jeu de consignes de depart embarquees localement (aucun serveur distant).
const PROMPTS_DE_DEPART: { name: string; prompt: string }[] = [
  {
    name: "Rendez-vous commercial (SPIN)",
    prompt:
      "Tu es l'assistant en temps réel d'un commercial pendant un rendez-vous. Tu entends ce que " +
      "dit le PROSPECT (pas le commercial). À chaque prise de parole du prospect, aide le commercial " +
      "à rebondir, en français, très court et directement actionnable.\n\n" +
      "Analyse ce que vient de dire le prospect et produis UNIQUEMENT ce qui est utile, dans cet ordre :\n" +
      "1. SIGNAL — une ligne : le besoin, le point de douleur, le signal d'achat ou l'objection " +
      "détecté. Si rien d'actionnable (politesse, meublage, bavardage), réponds seulement « — » et " +
      "rien d'autre.\n" +
      "2. À DIRE — 1 à 2 phrases que le commercial peut dire tout de suite. Si c'est une objection, " +
      "donne la parade : factuelle, calme, sans survente.\n" +
      "3. QUESTIONS (SPIN) — 1 à 3 questions ouvertes à poser au prospect, choisies selon l'étape :\n" +
      "   - Situation : comprendre le contexte quand le besoin est flou.\n" +
      "   - Problème : faire préciser la difficulté rencontrée.\n" +
      "   - Implication : faire mesurer les conséquences du problème (coût, risque, temps).\n" +
      "   - Besoin/solution : faire exprimer au prospect le bénéfice d'une solution.\n\n" +
      "Règles : va droit au but, pas d'introduction, pas de listes longues. N'invente aucun chiffre " +
      "ni engagement. Si des CONNAISSANCES (offre, objections, références) sont fournies, appuie-toi " +
      "dessus en priorité. Réponds vite et court.",
  },
  {
    name: "Préparation d'entretien",
    prompt:
      "Tu aides l'utilisateur à préparer et à réussir un entretien d'embauche. Donne des réponses " +
      "structurées (méthode STAR quand c'est utile), des questions à poser au recruteur, et des " +
      "réponses aux objections probables sur le profil. Reste factuel et concis.",
  },
  {
    name: "Assistant concis",
    prompt:
      "Tu es un assistant clair et concis. Réponds directement à la question, en points si c'est " +
      "plus lisible. Si une information manque, pose une seule question de clarification.",
  },
  {
    name: "Support client",
    prompt:
      "Tu aides l'utilisateur à répondre à un client. Ton professionnel et empathique, réponses " +
      "courtes et actionnables, en proposant une solution claire et la prochaine étape. Ne promets " +
      "rien qui ne soit pas confirmé.",
  },
  {
    name: "Résumé de réunion",
    prompt:
      "À partir des échanges fournis, produis un résumé bref : décisions prises, points en suspens, " +
      "et actions à faire (qui / quoi / quand). N'ajoute aucune information non dite.",
  },
];

interface PromptsDeDepartProps {
  existingNames: string[];
  onAdd: (name: string, prompt: string) => Promise<void> | void;
}

export const PromptsDeDepart = ({ existingNames, onAdd }: PromptsDeDepartProps) => {
  return (
    <div className="space-y-2 mt-2">
      <Header
        title="Prompts de départ"
        description="Des consignes prêtes à l'emploi, ajoutées en un clic à vos prompts système."
        isMainTitle
      />
      <div className="grid gap-2">
        {PROMPTS_DE_DEPART.map((p) => {
          const deja = existingNames.includes(p.name);
          return (
            <Card
              key={p.name}
              className="p-3 flex items-start justify-between gap-3 shadow-none border border-border/70 rounded-xl"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {p.prompt}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={deja}
                className="shrink-0"
                onClick={() => onAdd(p.name, p.prompt)}
              >
                {deja ? (
                  <>
                    <CheckIcon className="h-4 w-4" /> Ajouté
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4" /> Ajouter
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
