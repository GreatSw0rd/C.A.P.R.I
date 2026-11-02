import {
  Card,
  Button,
  Header,
  TextInput,
  Switch,
  Textarea,
  Selection,
} from "@/components";
import { PlusIcon, SaveIcon } from "lucide-react";
import { useCustomAiProviders } from "@/hooks";
import { MODELES_LLM } from "@/config";
import { cn } from "@/lib/utils";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomAiProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomAiProviders();

  const {
    showForm,
    setShowForm,
    editingProvider,
    formData,
    setFormData,
    errors,
    handleSave,
    setErrors,
    handleAutoFill,
    modeleConseille,
  } = hookInstance;

  return (
    <>
      {!showForm ? (
        <Button
          onClick={() => {
            setShowForm(true);
            setErrors({});
          }}
          variant="outline"
          className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Ajouter un LLM
        </Button>
      ) : (
        <Card className="p-4 border !bg-transparent border-input/50 ">
          <div className="flex justify-between items-center">
            <Header
              title={editingProvider ? "Modifier le LLM" : "Ajouter un LLM"}
              description="Choisissez un modèle dans « Remplissage auto », ou collez votre propre commande curl."
            />

            <div className="w-[230px]">
              <Selection
                options={MODELES_LLM.map((m) => ({
                  label: m.libelle,
                  value: m.id,
                }))}
                placeholder={"Remplissage auto"}
                onChange={(value) => {
                  handleAutoFill(value);
                }}
              />
            </div>
          </div>

          {modeleConseille && (
            <p className="mt-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              Après l'enregistrement, choisissez ce LLM dans la liste ci-dessous et
              saisissez dans le champ MODEL : <strong>{modeleConseille}</strong>
            </p>
          )}

          <div className="space-y-1 pt-2">
            <Header
              title="Nom"
              description="Le nom affiché dans les listes (ex. « Mistral perso »)."
            />
            <TextInput
              placeholder="Mon fournisseur"
              value={formData.name || ""}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, name: value }))
              }
            />
          </div>

          <div className="">
            {/* Basic Configuration */}
            <div className="space-y-1">
              <Header
                title="Commande curl *"
                description="La requête envoyée au LLM."
              />
              <Textarea
                className={cn(
                  "h-74 font-mono text-sm",
                  errors.curl && "border-red-500"
                )}
                placeholder={`curl --location 'http://127.0.0.1:1337/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_API_KEY or {{API_KEY}}' \
--data '{
        "model": "your-model-name or {{MODEL}}",
        "messages": [
            {
                "role": "system",
                "content": "{{SYSTEM_PROMPT}}"
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "{{TEXT}}"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "data:image/jpeg;base64,{{IMAGE}}"
                        }
                    }
                ]
            }
        ]
    }'`}
                value={formData.curl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, curl: e.target.value }))
                }
              />
              {errors.curl && (
                <p className="text-xs text-red-500 mt-1">{errors.curl}</p>
              )}

              {/* Variable Instructions */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div className="bg-card border p-3 rounded-lg">
                  <p className="text-sm font-medium text-primary mb-2">
                    💡 Les variables entre doubles accolades deviennent des champs à remplir
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Par exemple{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{API_KEY}}"}
                    </code>{" "}
                    et{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{MODEL}}"}
                    </code>{" "}
                    : après l'enregistrement, choisissez ce fournisseur et
                    remplissez ces champs. Vous pouvez aussi écrire la clé
                    directement dans la commande.
                  </p>
                </div>

                <h4 className="text-sm font-semibold text-foreground">
                  ⚠️ Variables reconnues :
                </h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{TEXT}}"}
                    </code>
                    <span className="text-foreground font-medium">
                      → OBLIGATOIRE : le texte de la question
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{IMAGE}}"}
                    </code>
                    <span className="text-muted-foreground">
                      → La capture d'écran (en base64), seulement si le LLM
                      lit les images
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{SYSTEM_PROMPT}}"}
                    </code>
                    <span className="text-muted-foreground">
                      → Le prompt système (facultatif)
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Le plus simple :</strong>{" "}
                    utilisez « Remplissage auto » en haut à droite, puis
                    enregistrez.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">
                      Variables personnalisées :
                    </strong>{" "}
                    toute variable écrite au format{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{NOM_VARIABLE}}"}
                    </code>{" "}
                    devient un champ à remplir quand vous choisissez ce
                    fournisseur.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    💡 N'ajoutez{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{IMAGE}}"}
                    </code>{" "}
                    que si le modèle lit les images : sinon le bouton « Utiliser
                    l'image » sera proposé à tort.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center space-x-2">
            <Header
              title="Réponse progressive"
              description="La réponse s'affiche au fur et à mesure qu'elle s'écrit."
            />
            <Switch
              checked={formData.streaming}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  streaming: checked,
                }))
              }
            />
          </div>
          {/* Response Configuration */}
          <div className="space-y-2">
            <Header
              title="Chemin de la réponse *"
              description="Où se trouve le texte dans la réponse de l'API."
            />

            <TextInput
              placeholder="choices[0].message.content"
              value={formData.responseContentPath || ""}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  responseContentPath: value,
                }))
              }
              error={errors.responseContentPath}
              notes="Exemples : choices[0].message.content (Groq, Mistral, OpenAI, Ollama), text, candidates[0].content.parts[0].text"
            />
          </div>

          <div className="flex justify-end gap-2 -mt-3">
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.curl.trim()}
              className={cn(
                "h-11 border-1 border-input/50 focus:border-primary/50 transition-colors",
                errors.curl && "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              {errors.curl ? (
                "Commande curl invalide, réessayez"
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {editingProvider ? "Mettre à jour" : "Enregistrer"}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
