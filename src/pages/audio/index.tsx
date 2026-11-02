import { AudioSelection, TranscriptionOnlyToggle } from "./components";
import { PageLayout } from "@/layouts";
import { getPlatform } from "@/lib";

const getOsInstructions = () => {
  const platform = getPlatform();

  switch (platform) {
    case "macos":
      return {
        mic: "Réglages Système → Son → Entrée",
        audio: "Réglages Système → Son → Sortie",
      };
    case "windows":
      return {
        mic: "Paramètres → Système → Son → Entrée",
        audio: "Paramètres → Système → Son → Sortie",
      };
    case "linux":
      return {
        mic: "Paramètres du son → Entrée",
        audio: "Paramètres du son → Sortie",
      };
    default:
      return {
        mic: "les paramètres du son",
        audio: "les paramètres du son",
      };
  }
};

const Audio = () => {
  const osInstructions = getOsInstructions();

  return (
    <PageLayout
      title="Audio"
      description="Le micro (votre voix) et la sortie audio (la voix de votre interlocuteur) utilisés par la dictée et l'écoute."
    >
      <AudioSelection />

      <TranscriptionOnlyToggle />

      <div className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-md mb-4 space-y-2">
        <p>
          <strong>⚠️ Si un appareil ne fonctionne pas :</strong> vérifiez les
          appareils par défaut de votre ordinateur, dans{" "}
          <strong>{osInstructions.mic}</strong> pour le micro et{" "}
          <strong>{osInstructions.audio}</strong> pour les haut-parleurs ou
          le casque.
        </p>
        <p className="text-amber-600/80">
          <strong>À noter :</strong> si l'appareil choisi est indisponible,
          C.A.P.R.I utilise automatiquement les appareils par défaut de
          l'ordinateur.
        </p>
      </div>
    </PageLayout>
  );
};

export default Audio;
