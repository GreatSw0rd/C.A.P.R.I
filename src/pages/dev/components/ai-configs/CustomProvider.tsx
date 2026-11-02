import { UseSettingsReturn } from "@/types";
import { Card, Button, Header } from "@/components";
import { EditIcon, TrashIcon } from "lucide-react";
import { CreateEditProvider } from "./CreateEditProvider";
import { useCustomAiProviders } from "@/hooks";
import curl2Json from "@bany/curl-to-json";

export const CustomProviders = ({ allAiProviders }: UseSettingsReturn) => {
  const customProviderHook = useCustomAiProviders();
  const {
    handleEdit,
    handleDelete,
    deleteConfirm,
    confirmDelete,
    cancelDelete,
  } = customProviderHook;

  return (
    <div className="space-y-2">
      <Header
        title="Vos LLM"
        description="Les LLM que vous avez ajoutés. Ils apparaissent dans le sélecteur de l’outil."
      />

      <div className="space-y-2">
        {/* Existing Custom Providers */}
        {allAiProviders.filter((provider) => provider?.isCustom).length > 0 && (
          <div className="space-y-2">
            {allAiProviders
              .filter((provider) => provider?.isCustom)
              .map((provider) => {
                const json = curl2Json(provider?.curl);

                return (
                  <Card
                    key={provider?.id}
                    className="p-3 border !bg-transparent border-input/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">
                          {provider?.name || json?.url || "Commande curl invalide"}
                        </h4>
                        {provider?.name && json?.url && (
                          <p className="text-xs text-muted-foreground">{json.url}</p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {`Response Path: ${
                              provider?.responseContentPath || "non défini"
                            }`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {" • "}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Progressif : {provider?.streaming ? "oui" : "non"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            provider?.id && handleEdit(provider?.id)
                          }
                          title="Modifier"
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            provider?.id && handleDelete(provider?.id)
                          }
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
      <CreateEditProvider customProviderHook={customProviderHook} />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Supprimer ce LLM ?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cette action est définitive.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
