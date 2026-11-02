import { useEffect, useRef, useState } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { AudioLinesIcon, LoaderCircleIcon, SquareIcon } from "lucide-react";
import { useApp } from "@/contexts";
import { fetchSTT } from "@/lib";
import { floatArrayToWav } from "@/lib/utils";
import { definirDrapeau, signalerAudio } from "@/lib/capri-activite";
import { arreterVoix, parler } from "@/lib/voix";
import { UseCompletionReturn } from "@/types";

type Etat = "ecoute" | "parole" | "transcription" | "reflexion" | "reponse";

// Conversation vocale : on parle, la question est transcrite et envoyee, la reponse est lue
// a voix haute, puis C.A.P.R.I se remet a l'ecoute. Le micro est coupe pendant la reflexion
// et la lecture, pour que l'IA ne s'entende pas elle-meme.
export const ConversationVocale = ({
  completion,
  onQuitter,
}: {
  completion: UseCompletionReturn;
  onQuitter: () => void;
}) => {
  const { selectedSttProvider, allSttProviders, selectedAudioDevices } = useApp();
  const { submit, setState, isLoading, response, conversationHistory } = completion;
  const [transcription, setTranscription] = useState(false);
  const [lecture, setLecture] = useState(false);

  const micro = selectedAudioDevices.input.id;
  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: true,
    additionalAudioConstraints:
      micro && micro !== "default" ? { deviceId: { exact: micro } } : {},
    onFrameProcessed: (_probs, frame) => {
      let somme = 0;
      for (let i = 0; i < frame.length; i++) somme += frame[i] * frame[i];
      signalerAudio(Math.sqrt(somme / Math.max(1, frame.length)));
    },
    onSpeechEnd: async (audio) => {
      const fournisseur = allSttProviders.find(
        (p) => p.id === selectedSttProvider.provider
      );
      if (!fournisseur) {
        setState((prev: any) => ({
          ...prev,
          error: "Aucun service de transcription configuré (Fournisseurs d'IA).",
        }));
        return;
      }
      setTranscription(true);
      try {
        const texte = await fetchSTT({
          provider: fournisseur,
          selectedProvider: selectedSttProvider,
          audio: floatArrayToWav(audio, 16000, "wav"),
        });
        if (texte.trim()) submit(texte);
      } catch (e) {
        setState((prev: any) => ({
          ...prev,
          error: e instanceof Error ? e.message : "La transcription a échoué",
        }));
      } finally {
        setTranscription(false);
      }
    },
  });

  // Lit chaque nouvelle reponse des qu'elle est terminee.
  const chargeait = useRef(isLoading);
  useEffect(() => {
    if (chargeait.current && !isLoading) {
      const dernier = [...conversationHistory]
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter((m) => m.role === "assistant")
        .pop();
      const texte = response || dernier?.content || "";
      if (texte) {
        parler(texte, {
          cle: "conversation-vocale",
          onDebut: () => setLecture(true),
          onFin: () => setLecture(false),
        });
        setLecture(true);
      }
    }
    chargeait.current = isLoading;
  }, [isLoading]);

  // Micro coupe pendant la transcription, la reflexion et la lecture.
  const occupe = transcription || isLoading || lecture;
  useEffect(() => {
    if (occupe && vad.listening) vad.pause();
    if (!occupe && !vad.listening && !vad.loading) vad.start();
  }, [occupe, vad.listening, vad.loading]);

  // L'orbe s'anime pendant que C.A.P.R.I parle.
  useEffect(() => {
    definirDrapeau("reponse", lecture, "voix");
    return () => definirDrapeau("reponse", false, "voix");
  }, [lecture]);

  // En quittant le mode : plus de voix, plus de micro.
  useEffect(
    () => () => {
      arreterVoix();
    },
    []
  );

  const etat: Etat = lecture
    ? "reponse"
    : isLoading
    ? "reflexion"
    : transcription
    ? "transcription"
    : vad.userSpeaking
    ? "parole"
    : "ecoute";

  const libelle: Record<Etat, string> = {
    ecoute: "À l'écoute",
    parole: "Je vous écoute…",
    transcription: "Transcription…",
    reflexion: "Réflexion…",
    reponse: "Interrompre",
  };

  return (
    <button
      type="button"
      className="ov-pill"
      data-active="true"
      title={
        etat === "reponse"
          ? "Couper la réponse et reprendre la parole"
          : "Conversation vocale active : cliquer pour l'arrêter"
      }
      onClick={() => {
        if (lecture) {
          arreterVoix();
          setLecture(false);
          return;
        }
        vad.pause();
        onQuitter();
      }}
    >
      {etat === "reponse" ? (
        <SquareIcon className="h-3.5 w-3.5 fill-current" />
      ) : etat === "transcription" || etat === "reflexion" ? (
        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
      ) : (
        <AudioLinesIcon
          className={`h-4 w-4 ${etat === "parole" ? "text-[rgb(var(--ov-accent))]" : "animate-pulse"}`}
        />
      )}
      {libelle[etat]}
    </button>
  );
};
