import { MicIcon } from "lucide-react";
import { useApp } from "@/contexts";
import { ouvrirTableauDeBord } from "@/lib";
import { UseCompletionReturn } from "@/types";
import { AutoSpeechVAD } from "../completion/AutoSpeechVad";
import { raccourci } from "./raccourcis";

// Bouton "Dicter" : pose une question a la voix (micro), via le fournisseur STT configure.
export const DictatePill = ({
  enableVAD,
  setEnableVAD,
  submit,
  setState,
}: UseCompletionReturn) => {
  const { selectedSttProvider, selectedAudioDevices } = useApp();
  const touche = raccourci("audio_recording");

  if (!selectedSttProvider.provider) {
    return (
      <button
        type="button"
        className="ov-pill"
        title="Pour dicter, choisissez d'abord un fournisseur de transcription (STT) dans Fournisseurs d'IA"
        onClick={() => ouvrirTableauDeBord("/dev-space")}
      >
        <MicIcon className="h-4 w-4" />
        Dicter
        <span className="ov-kbd">STT à configurer</span>
      </button>
    );
  }

  if (enableVAD) {
    return (
      <AutoSpeechVAD
        key={selectedAudioDevices.input.id}
        submit={submit}
        setState={setState}
        setEnableVAD={setEnableVAD}
        microphoneDeviceId={selectedAudioDevices.input.id}
        className="ov-pill"
      />
    );
  }

  return (
    <button
      type="button"
      className="ov-pill"
      title="Poser votre question à la voix (micro)"
      onClick={() => setEnableVAD(true)}
    >
      <MicIcon className="h-4 w-4" />
      Dicter
      {touche && <span className="ov-kbd">{touche}</span>}
    </button>
  );
};
