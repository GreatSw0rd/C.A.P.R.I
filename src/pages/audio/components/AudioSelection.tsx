import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Header,
  Button,
} from "@/components";
import { MicIcon, RefreshCwIcon, HeadphonesIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts";
import { STORAGE_KEYS } from "@/config/constants";
import { safeLocalStorage } from "@/lib/storage";
import { invoke } from "@tauri-apps/api/core";

export const AudioSelection = () => {
  const { selectedAudioDevices, setSelectedAudioDevices } = useApp();

  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [showSuccess, setShowSuccess] = useState<{
    input: boolean;
    output: boolean;
  }>({
    input: false,
    output: false,
  });
  const [devices, setDevices] = useState<{
    input: { id: string; name: string; is_default: boolean }[];
    output: { id: string; name: string; is_default: boolean }[];
  }>({
    input: [],
    output: [],
  });

  // Save devices to localStorage
  const saveToStorage = (newDevices: typeof selectedAudioDevices) => {
    safeLocalStorage.setItem(
      STORAGE_KEYS.SELECTED_AUDIO_DEVICES,
      JSON.stringify(newDevices)
    );
  };

  // Load all audio devices (input and output)
  const loadAudioDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const [inputDevices, outputDevices] = await Promise.all([
        invoke<{ id: string; name: string; is_default: boolean }[]>(
          "get_input_devices"
        ),
        invoke<{ id: string; name: string; is_default: boolean }[]>(
          "get_output_devices"
        ),
      ]);

      setDevices({
        input:
          inputDevices.map((input) => ({
            id: input?.id,
            name: input?.name,
            is_default: input?.is_default,
          })) || [],
        output:
          outputDevices.map((output) => ({
            id: output?.id,
            name: output?.name,
            is_default: output?.is_default,
          })) || [],
      });

      // Only update if no device is currently selected or if the selected device doesn't exist
      const currentInputExists = inputDevices.some(
        (d) => d.id === selectedAudioDevices.input.id
      );
      const currentOutputExists = outputDevices.some(
        (d) => d.id === selectedAudioDevices.output.id
      );

      if (!currentInputExists || !currentOutputExists) {
        const defaultInput = inputDevices?.find((d) => d?.is_default);
        const defaultOutput = outputDevices?.find((d) => d?.is_default);

        const newDevices = {
          input: currentInputExists
            ? selectedAudioDevices.input
            : {
                id: defaultInput?.id || inputDevices[0]?.id || "",
                name: defaultInput?.name || inputDevices[0]?.name || "",
              },
          output: currentOutputExists
            ? selectedAudioDevices.output
            : {
                id: defaultOutput?.id || outputDevices[0]?.id || "",
                name: defaultOutput?.name || outputDevices[0]?.name || "",
              },
        };

        setSelectedAudioDevices(newDevices);
        saveToStorage(newDevices);
      }
    } catch (error) {
      console.error("Error loading audio devices:", error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadAudioDevices();
  }, []);

  // Handle device selection changes
  const handleDeviceChange = (type: "input" | "output", deviceId: string) => {
    const deviceList = type === "input" ? devices.input : devices.output;
    const selectedDevice = deviceList.find((d) => d.id === deviceId);

    if (!selectedDevice) return;

    const newDevices = {
      ...selectedAudioDevices,
      [type]: { id: deviceId, name: selectedDevice.name },
    };

    setSelectedAudioDevices(newDevices);
    saveToStorage(newDevices);

    setShowSuccess((prev) => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setShowSuccess((prev) => ({ ...prev, [type]: false }));
    }, 3000);
  };

  return (
    <div id="audio" className="space-y-1 flex flex-col gap-4">
      {/* Microphone Input Section */}
      <div className="space-y-3">
        <Header
          title="Micro"
          description="Le micro utilisé pour votre voix (dictée et écoute)."
        />

        <div className="space-y-3">
          {/* Microphone Selection Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select
                value={selectedAudioDevices.input.id}
                onValueChange={(value) => handleDeviceChange("input", value)}
                disabled={isLoadingDevices || devices?.input?.length === 0}
              >
                <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <MicIcon className="size-4" />
                    <div className="text-sm font-medium truncate">
                      {isLoadingDevices
                        ? "Chargement des micros…"
                        : devices?.input?.length === 0
                        ? "Aucun micro trouvé"
                        : devices?.input?.find(
                            (mic) => mic?.id === selectedAudioDevices.input.id
                          )?.name +
                            (devices?.input?.find(
                              (mic) => mic?.id === selectedAudioDevices.input.id
                            )?.is_default
                              ? " (par défaut)"
                              : "") || "Choisir un micro"}
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {devices?.input?.map((mic) => (
                    <SelectItem key={mic?.id} value={mic?.id}>
                      <div className="flex items-center gap-2">
                        <MicIcon className="size-4" />
                        <div className="font-medium truncate">{mic?.name} </div>
                        {mic?.is_default && " (par défaut)"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Refresh button */}
              <Button
                size="icon"
                variant="outline"
                onClick={loadAudioDevices}
                disabled={isLoadingDevices}
                className="h-11 w-11 shrink-0"
                title="Actualiser la liste des micros"
              >
                <RefreshCwIcon
                  className={`size-4 ${isLoadingDevices ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Success message */}
          {showSuccess.input && (
            <div className="text-xs text-green-500 bg-green-500/10 p-3 rounded-md">
              <strong>✓ Micro changé</strong>
              <br />
              Utilisé : {selectedAudioDevices.input.name || "appareil inconnu"}
            </div>
          )}

          {/* Permission Notice */}
          {devices?.input?.length === 0 && !isLoadingDevices && (
            <div className="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-md">
              <strong>
                ⚠️ Cliquez sur le bouton d'actualisation pour charger les micros.
              </strong>{" "}
              Sinon, changez le micro par défaut dans les paramètres de
              l'ordinateur.
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground/70">
          <p>
            💡 <strong>Astuce :</strong> le changement de micro est immédiat.
          </p>
        </div>
      </div>

      {/* System Audio Output Section */}
      <div className="space-y-3">
        <Header
          title="Son de l'ordinateur"
          description="La sortie audio écoutée pendant un appel : c'est par là qu'arrive la voix de votre interlocuteur."
        />

        <div className="space-y-3">
          {/* Output Selection Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select
                value={selectedAudioDevices.output.id}
                onValueChange={(value) => handleDeviceChange("output", value)}
                disabled={isLoadingDevices || devices?.output?.length === 0}
              >
                <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <HeadphonesIcon className="size-4" />
                    <div className="text-sm font-medium truncate">
                      {isLoadingDevices
                        ? "Chargement des sorties audio…"
                        : devices?.output?.length === 0
                        ? "Aucune sortie audio trouvée"
                        : devices?.output?.find(
                            (output) =>
                              output?.id === selectedAudioDevices.output.id
                          )?.name +
                            (devices?.output?.find(
                              (output) =>
                                output?.id === selectedAudioDevices.output.id
                            )?.is_default
                              ? " (par défaut)"
                              : "") || "Choisir une sortie audio"}
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {devices?.output?.map((output) => (
                    <SelectItem key={output?.id} value={output?.id}>
                      <div className="flex items-center gap-2">
                        <HeadphonesIcon className="size-4" />
                        <div className="font-medium truncate">
                          {output?.name} {output?.is_default && " (par défaut)"}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Refresh button */}
              <Button
                size="icon"
                variant="outline"
                onClick={loadAudioDevices}
                disabled={isLoadingDevices}
                className="h-11 w-11 shrink-0"
                title="Actualiser la liste des sorties"
              >
                <RefreshCwIcon
                  className={`size-4 ${isLoadingDevices ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Success message */}
          {showSuccess.output && (
            <div className="text-xs text-green-500 bg-green-500/10 p-3 rounded-md">
              <strong>✓ Sortie audio changée</strong>
              <br />
              Utilisée : {selectedAudioDevices.output.name || "appareil inconnu"}
            </div>
          )}

          {/* Permission Notice */}
          {devices?.output?.length === 0 && !isLoadingDevices && (
            <div className="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-md">
              <strong>
                ⚠️ Cliquez sur le bouton d'actualisation pour charger les sorties audio.
              </strong>{" "}
              Sinon, changez la sortie par défaut dans les paramètres de
              l'ordinateur.
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground/70">
          <p>
            💡 <strong>Astuce :</strong> choisissez la sortie où vous entendez
            l'appel (casque ou haut-parleurs) pour que l'écoute capte votre
            interlocuteur.
          </p>
        </div>
      </div>
    </div>
  );
};
