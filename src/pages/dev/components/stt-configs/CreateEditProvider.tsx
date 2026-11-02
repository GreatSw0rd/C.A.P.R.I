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
import { useCustomSttProviders } from "@/hooks";
import { useApp } from "@/contexts";
import { cn } from "@/lib/utils";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomSttProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  const { allSttProviders } = useApp();
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomSttProviders();

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
          Ajouter un service de transcription
        </Button>
      ) : (
        <Card className="p-4 border border-input/50 bg-transparent">
          <div className="flex justify-between items-center">
            <Header
              title={
                editingProvider
                  ? "Modifier le service de transcription"
                  : "Ajouter un service de transcription"
              }
              description="Choisissez un modèle dans « Remplissage auto », ou collez votre propre commande curl."
            />
            <div className="w-[230px]">
              <Selection
                options={allSttProviders
                  ?.filter((provider) => !provider?.isCustom)
                  .map((provider) => ({
                    label: provider?.name || provider?.id || "Service",
                    value: provider?.id || "",
                  }))}
                placeholder={"Remplissage auto"}
                onChange={(value) => {
                  handleAutoFill(value);
                }}
              />
            </div>
          </div>

          <div className="">
            {/* Basic Configuration */}
            <div className="space-y-1">
              <Header
                title="Commande curl *"
                description="La requête envoyée au service de transcription."
              />
              <Textarea
                className={cn(
                  "h-74 font-mono text-sm",
                  errors.curl && "border-red-500"
                )}
                placeholder={`curl -X POST "https://api.openai.com/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO}}" \\
      -F "model={{MODEL}}"`}
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
                  ⚠️ Variable obligatoire :
                </h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{AUDIO}}"}
                    </code>
                    <span className="text-foreground font-medium">
                      → L'audio à transcrire : fichier WAV avec -F (formulaire),
                      sinon audio encodé en base64
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
                    💡 Sans{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{AUDIO}}"}
                    </code>{" "}
                    dans la commande, aucun son n'est envoyé.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between items-center space-x-2">
              <Header
                title="Réponse progressive"
                description="Non disponible pour la transcription."
              />
              <Switch
                checked={formData.streaming}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    streaming: checked,
                  }))
                }
                disabled={true}
              />
            </div>

          </div>
          {/* Response Configuration */}
          <div className="space-y-2">
            <Header
              title="Chemin de la réponse *"
              description="Où se trouve le texte dans la réponse de l'API."
            />

            <TextInput
              placeholder="text"
              value={formData.responseContentPath || ""}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  responseContentPath: value,
                }))
              }
              error={errors.responseContentPath}
              notes="Exemples : text (Groq, OpenAI), transcript, results[0].alternatives[0].transcript"
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
