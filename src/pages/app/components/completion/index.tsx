import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  definirDrapeau,
  signalerImpulsion,
} from "@/lib/capri-activite";
import {
  CameraIcon,
  CropIcon,
  PaperclipIcon,
  FolderOpenIcon,
  AudioLinesIcon,
} from "lucide-react";
import { useCompletion } from "@/hooks";
import { useApp } from "@/contexts";
import { ouvrirTableauDeBord, choisirImagesPour } from "@/lib";
import { MAX_FILES } from "@/config";
import { ConversationPanel, InputBar } from "./Input";
import { ModelPicker } from "./ModelPicker";
import { DictatePill } from "../overlay/DictatePill";
import { ConversationVocale } from "../overlay/ConversationVocale";
import { PromptPicker } from "../overlay/PromptPicker";

// Vue "Demander" : conversation, relances, barre d'outils et saisie.
// Le composant reste monte meme quand un autre onglet est affiche (hidden), pour garder la
// conversation et les raccourcis globaux (capture, dictee) actifs.
export const Completion = ({
  isHidden,
  hidden,
}: {
  isHidden: boolean;
  hidden?: boolean;
}) => {
  const completion = useCompletion();
  const { supportsImages, selectedSttProvider } = useApp();
  // Conversation vocale : on parle, C.A.P.R.I repond a voix haute.
  const [vocal, setVocal] = useState(false);

  // Activite de l'orbe : reflexion puis reponse qui s'ecrit.
  const { isLoading, response } = completion;
  useEffect(() => {
    definirDrapeau("reflexion", isLoading && !response, "demander");
    definirDrapeau("reponse", isLoading && !!response, "demander");
  }, [isLoading, response]);
  useEffect(() => {
    if (isLoading && response) signalerImpulsion(0.3);
  }, [isLoading, response]);

  // Question envoyee depuis le tableau de bord.
  const submitRef = useRef(completion.submit);
  submitRef.current = completion.submit;
  useEffect(() => {
    const un = listen<{ texte?: string }>("overlay-demander", (e) => {
      const texte = (e.payload?.texte || "").trim();
      if (texte) submitRef.current(texte);
    });
    return () => {
      un.then((fn) => fn());
    };
  }, []);

  const imagesBloquees =
    !supportsImages ||
    completion.isLoading ||
    completion.isScreenshotLoading ||
    completion.attachedFiles.length >= MAX_FILES;
  const titreImages = !supportsImages
    ? "Le fournisseur actuel ne prend pas les images"
    : undefined;

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 w-full ${hidden ? "hidden" : ""}`}
    >
      <ConversationPanel {...completion} />


      <div className="shrink-0 px-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          {vocal ? (
            <ConversationVocale completion={completion} onQuitter={() => setVocal(false)} />
          ) : (
            <>
              <DictatePill {...completion} />
              <button
                type="button"
                className="ov-pill"
                disabled={!selectedSttProvider.provider}
                title={
                  selectedSttProvider.provider
                    ? "Conversation vocale : parlez, C.A.P.R.I vous répond à voix haute"
                    : "Choisissez d'abord un service de transcription dans Fournisseurs d'IA"
                }
                onClick={() => {
                  // Un seul micro a la fois, et la conversation garde le fil des echanges.
                  completion.setEnableVAD(false);
                  completion.setKeepEngaged(true);
                  setVocal(true);
                }}
              >
                <AudioLinesIcon className="h-4 w-4" />
                Parler
              </button>
            </>
          )}
          <div className="ov-group">
            <button
              type="button"
              className="ov-icon"
              title={titreImages ?? "Capture de l'écran entier (jointe au message)"}
              disabled={imagesBloquees}
              onClick={completion.captureFullScreen}
            >
              <CameraIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="ov-icon"
              title={titreImages ?? "Sélectionner une zone de l'écran"}
              disabled={imagesBloquees}
              onClick={completion.captureSelection}
            >
              <CropIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="ov-icon"
              title={titreImages ?? "Joindre une image"}
              disabled={imagesBloquees}
              onClick={() => choisirImagesPour(completion.handleFileSelect)}
            >
              <PaperclipIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="ov-icon"
              title="Connaissances (documents injectés dans les réponses)"
              onClick={() => ouvrirTableauDeBord("/knowledge")}
            >
              <FolderOpenIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1" />
          <PromptPicker />
          <ModelPicker />
        </div>

        <InputBar {...completion} isHidden={isHidden} />
      </div>
    </div>
  );
};
