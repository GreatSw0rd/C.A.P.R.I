import { useState } from "react";
import { Switch, Label, Header } from "@/components";
import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";

/**
 * Mode "transcription seule" : pendant l'ecoute, C.A.P.R.I transcrit l'audio capture et
 * enregistre le texte, sans demander de reponse a l'IA. Utile pour des notes de reunion.
 */
export const TranscriptionOnlyToggle = () => {
  const [enabled, setEnabled] = useState<boolean>(
    safeLocalStorage.getItem(STORAGE_KEYS.TRANSCRIPTION_ONLY) === "true"
  );

  const onChange = (value: boolean) => {
    setEnabled(value);
    safeLocalStorage.setItem(STORAGE_KEYS.TRANSCRIPTION_ONLY, String(value));
  };

  return (
    <div id="transcription-only" className="space-y-2">
      <Header
        title="Transcription seule"
        description="Transcrit l'audio sans générer de réponse de l'IA (prise de notes de réunion)."
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">
            {enabled ? "Transcription seule activée" : "Transcription + réponse IA"}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            {enabled
              ? "L'IA n'est pas sollicitée ; seul le texte transcrit est enregistré."
              : "Après transcription, l'IA répond selon votre prompt."}
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onChange}
          aria-label="Activer la transcription seule"
        />
      </div>
    </div>
  );
};
