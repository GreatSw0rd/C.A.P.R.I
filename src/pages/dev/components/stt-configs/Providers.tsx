import { Button, Header, Input, Selection, TextInput } from "@/components";
import { UseSettingsReturn } from "@/types";
import curl2Json, { ResultJSON } from "@bany/curl-to-json";
import { EyeIcon, EyeOffIcon, KeyIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Providers = ({
  allSttProviders,
  selectedSttProvider,
  onSetSelectedSttProvider,
  sttVariables,
}: UseSettingsReturn) => {
  const [localSelectedProvider, setLocalSelectedProvider] =
    useState<ResultJSON | null>(null);
  // Afficher la cle en clair, pour verifier ce qui a ete colle.
  const [cleVisible, setCleVisible] = useState(false);

  useEffect(() => {
    if (selectedSttProvider?.provider) {
      const provider = allSttProviders?.find(
        (p) => p?.id === selectedSttProvider?.provider
      );
      if (provider) {
        const json = curl2Json(provider?.curl);
        setLocalSelectedProvider(json as ResultJSON);
      }
    }
  }, [selectedSttProvider?.provider]);

  const findKeyAndValue = (key: string) => {
    return sttVariables?.find((v) => v?.key === key);
  };

  const getApiKeyValue = () => {
    const apiKeyVar = findKeyAndValue("api_key");
    if (!apiKeyVar || !selectedSttProvider?.variables) return "";
    return selectedSttProvider?.variables?.[apiKeyVar.key] || "";
  };

  const isApiKeyEmpty = () => {
    return !getApiKeyValue().trim();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Header
          title="Service de transcription utilisé"
          description="Celui qui transcrit la dictée et l’écoute."
        />
        <Selection
          selected={selectedSttProvider?.provider}
          options={allSttProviders?.map((provider) => {
            const json = curl2Json(provider?.curl);
            return {
              label: provider?.isCustom
                ? json?.url || "Fournisseur personnalisé"
                : provider?.id || "Fournisseur personnalisé",
              value: provider?.id || "Fournisseur personnalisé",
              isCustom: provider?.isCustom,
            };
          })}
          placeholder="Choisir un service"
          onChange={(value) => {
            onSetSelectedSttProvider({
              provider: value,
              variables: {},
            });
          }}
        />
      </div>
      {localSelectedProvider ? (
        <Header
          title={`Adresse : ${localSelectedProvider?.url || "invalide"}`}
          description="Pour une autre adresse ou méthode, ajoutez votre propre fournisseur."
        />
      ) : null}
      {findKeyAndValue("api_key") ? (
        <div className="space-y-2">
          <Header
            title="Clé API"
            description="Votre clé est enregistrée uniquement sur cet ordinateur."
          />

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type={cleVisible ? "text" : "password"}
                placeholder="**********"
                value={getApiKeyValue()}
                onChange={(value) => {
                  const apiKeyVar = findKeyAndValue("api_key");
                  if (!apiKeyVar || !selectedSttProvider) return;

                  onSetSelectedSttProvider({
                    ...selectedSttProvider,
                    variables: {
                      ...selectedSttProvider.variables,
                      [apiKeyVar.key]:
                        typeof value === "string" ? value : value.target.value,
                    },
                  });
                }}
                onKeyDown={(e) => {
                  const apiKeyVar = findKeyAndValue("api_key");
                  if (!apiKeyVar || !selectedSttProvider) return;

                  onSetSelectedSttProvider({
                    ...selectedSttProvider,
                    variables: {
                      ...selectedSttProvider.variables,
                      [apiKeyVar.key]: (e.target as HTMLInputElement).value,
                    },
                  });
                }}
                disabled={false}
                className="flex-1 h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-11 w-11"
                onClick={() => setCleVisible((v) => !v)}
                title={cleVisible ? "Masquer la clé" : "Afficher la clé"}
              >
                {cleVisible ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </Button>
              {isApiKeyEmpty() ? (
                <Button
                  onClick={() => {
                    const apiKeyVar = findKeyAndValue("api_key");
                    if (!apiKeyVar || !selectedSttProvider || isApiKeyEmpty())
                      return;

                    onSetSelectedSttProvider({
                      ...selectedSttProvider,
                      variables: {
                        ...selectedSttProvider.variables,
                        [apiKeyVar.key]: getApiKeyValue(),
                      },
                    });
                  }}
                  disabled={isApiKeyEmpty()}
                  size="icon"
                  className="shrink-0 h-11 w-11"
                  title="Enregistrer la clé"
                >
                  <KeyIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const apiKeyVar = findKeyAndValue("api_key");
                    if (!apiKeyVar || !selectedSttProvider) return;

                    onSetSelectedSttProvider({
                      ...selectedSttProvider,
                      variables: {
                        ...selectedSttProvider.variables,
                        [apiKeyVar.key]: "",
                      },
                    });
                  }}
                  size="icon"
                  variant="destructive"
                  className="shrink-0 h-11 w-11"
                  title="Supprimer la clé"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4 mt-2">
        {sttVariables
          ?.filter(
            (variable) => variable?.key !== findKeyAndValue("api_key")?.key
          )
          .map((variable) => {
            const getVariableValue = () => {
              if (!variable?.key || !selectedSttProvider?.variables) return "";
              return selectedSttProvider.variables[variable.key] || "";
            };

            return (
              <div className="space-y-1" key={variable?.key}>
                <Header
                  title={variable?.value || ""}
                  description={variable?.key?.toLowerCase() === "model" ? "Le nom exact du modèle (voir la documentation du fournisseur)." : "Valeur demandée par la commande curl."}
                />
                <TextInput
                  placeholder={variable?.key?.toLowerCase() === "model" ? "ex. openai/gpt-oss-120b" : "Valeur"}
                  value={getVariableValue()}
                  onChange={(value) => {
                    if (!variable?.key || !selectedSttProvider) return;

                    onSetSelectedSttProvider({
                      ...selectedSttProvider,
                      variables: {
                        ...selectedSttProvider.variables,
                        [variable.key]: value,
                      },
                    });
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};
