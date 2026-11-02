import { useEffect, useState } from "react";
import {
  Loader2,
  ArrowUpIcon,
  PlusIcon,
  ImageIcon,
  SquareIcon,
  Volume2Icon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import { EVENEMENT_VOIX, arreterVoix, lectureEnCours, parler, voixDisponible } from "@/lib/voix";
import { ScrollArea, Markdown, Switch, CopyButton } from "@/components";
import { useApp } from "@/contexts";
import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";
import { UseCompletionReturn, ChatMessage } from "@/types";
import { AttachmentStrip } from "../overlay/AttachmentStrip";
import { BorderBeam } from "@/components/ui/border-beam";
import { OrbeCapri } from "@/components/fx/OrbeCapri";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

const estMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toLowerCase().includes("mac");

// Fil de conversation, toujours visible.
export const ConversationPanel = ({
  isLoading,
  response,
  error,
  conversationHistory,
  scrollAreaRef,
  keepEngaged,
  setKeepEngaged,
  startNewConversation,
  inputRef,
}: UseCompletionReturn) => {
  const messages = [...conversationHistory].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  const dernier = messages[messages.length - 1];
  const afficherLive =
    !!response &&
    (!dernier || dernier.role !== "assistant" || dernier.content !== response);
  const vide = messages.length === 0 && !response && !isLoading && !error;

  return (
    <div className="relative flex flex-1 min-h-0 flex-col">
      {!vide && (
        <div className="absolute right-3 top-2 z-10 flex items-center gap-2 select-none">
          <span className="text-[10px] ov-muted">Mode conversation</span>
          <span className="ov-kbd">{estMac ? "⌘" : "Ctrl"} + K</span>
          <Switch
            checked={keepEngaged}
            onCheckedChange={(c) => {
              setKeepEngaged(c);
              setTimeout(() => inputRef?.current?.focus(), 100);
            }}
          />
          <CopyButton content={response} />
          <button
            type="button"
            className="ov-icon !h-7 !w-7"
            title="Nouvelle conversation"
            onClick={() => startNewConversation()}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="px-4 pb-4 pt-11 space-y-3">
          {vide && (
            <div className="flex flex-col items-center justify-center text-center gap-2 py-6 select-none">
              <OrbeCapri className="size-32" />
              <p className="text-sm">
                Posez une question — ou lancez l'écoute et je suivrai la conversation.
              </p>
            </div>
          )}

          {messages.map((m: ChatMessage) => (
            <Bulle key={m.id} message={m} />
          ))}

          {afficherLive && (
            <div className={`capri-reponse ${isLoading ? "en-cours" : ""}`}>
              <Markdown isStreaming={isLoading}>{response}</Markdown>
            </div>
          )}

          {isLoading && !response && (
            <div className="flex items-center gap-2 select-none">
              <Loader2 className="h-4 w-4 animate-spin ov-muted" />
              <AnimatedShinyText className="mx-0 text-sm text-white/50 [--shiny-width:80px]">
                Réponse en cours…
              </AnimatedShinyText>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const Bulle = ({ message }: { message: ChatMessage }) => {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="ov-input max-w-[85%] px-3 py-2 text-sm">
          <Markdown>{message.content}</Markdown>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="capri-reponse">
        <Markdown>{message.content}</Markdown>
      </div>
      <ActionsReponse cle={message.id} contenu={message.content} />
    </div>
  );
};

// Premiere citation de la reponse : la phrase a dire mot pour mot.
function phraseADire(contenu: string): string | null {
  const lignes = contenu.split("\n");
  const debut = lignes.findIndex((l) => /^\s*>/.test(l));
  if (debut < 0) return null;
  const bloc: string[] = [];
  for (let i = debut; i < lignes.length && /^\s*>/.test(lignes[i]); i++) {
    bloc.push(lignes[i].replace(/^\s*>\s?/, ""));
  }
  const texte = bloc.join(" ").replace(/[*_«»"]/g, "").trim();
  return texte || null;
}

// Actions sous une reponse : l'ecouter a voix haute, copier la phrase a dire.
const ActionsReponse = ({ cle, contenu }: { cle: string; contenu: string }) => {
  const [lit, setLit] = useState(() => lectureEnCours() === cle);
  const [copie, setCopie] = useState(false);
  const phrase = phraseADire(contenu);

  useEffect(() => {
    const maj = (e: Event) => setLit((e as CustomEvent<string | null>).detail === cle);
    window.addEventListener(EVENEMENT_VOIX, maj);
    return () => window.removeEventListener(EVENEMENT_VOIX, maj);
  }, [cle]);

  return (
    <div className="capri-actions">
      {voixDisponible() && (
        <button
          type="button"
          data-active={lit}
          onClick={() => (lit ? arreterVoix() : parler(contenu, { cle }))}
          title={lit ? "Arrêter la lecture" : "Lire la réponse à voix haute"}
        >
          {lit ? <SquareIcon className="h-3 w-3 fill-current" /> : <Volume2Icon className="h-3.5 w-3.5" />}
          {lit ? "Arrêter" : "Écouter"}
        </button>
      )}
      {phrase && (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(phrase);
              setCopie(true);
              setTimeout(() => setCopie(false), 1500);
            } catch {
              setCopie(false);
            }
          }}
          title="Copier la phrase à dire"
        >
          {copie ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
          {copie ? "Copiée" : "Copier la phrase"}
        </button>
      )}
    </div>
  );
};

// Zone de saisie en bas : vignettes jointes, champ, "Utiliser l'image", envoyer.
export const InputBar = (props: UseCompletionReturn & { isHidden: boolean }) => {
  const {
    isLoading,
    input,
    setInput,
    handleKeyPress,
    handlePaste,
    inputRef,
    isHidden,
    submit,
    cancel,
    submitWithScreen,
    isScreenshotLoading,
    attachedFiles,
    removeFile,
  } = props;
  const { supportsImages } = useApp();
  const [utiliserImage, setUtiliserImage] = useState<boolean>(
    safeLocalStorage.getItem(STORAGE_KEYS.USE_SCREEN_IMAGE) === "true"
  );
  const imageActive = utiliserImage && supportsImages;

  const basculerImage = () => {
    const v = !utiliserImage;
    setUtiliserImage(v);
    safeLocalStorage.setItem(STORAGE_KEYS.USE_SCREEN_IMAGE, String(v));
  };

  const envoyer = () => {
    if (isLoading) {
      cancel();
      return;
    }
    if (!input.trim()) return;
    if (imageActive) {
      submitWithScreen();
    } else {
      submit();
    }
  };

  return (
    <div className="ov-input relative px-3 pt-2 pb-2 space-y-2">
      {isLoading && (
        <BorderBeam
          size={60}
          duration={3}
          colorFrom="rgb(196 234 170)"
          colorTo="rgb(124 77 255)"
        />
      )}
      <AttachmentStrip attachedFiles={attachedFiles} removeFile={removeFile} />
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          placeholder="Posez votre question, ou collez une capture…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey && imageActive) {
              e.preventDefault();
              envoyer();
              return;
            }
            handleKeyPress(e);
          }}
          onPaste={handlePaste}
          disabled={isHidden}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
        <button
          type="button"
          className={`ov-chip ${imageActive ? "ov-chip-image-on" : ""}`}
          data-active={imageActive}
          disabled={!supportsImages}
          onClick={basculerImage}
          title={
            !supportsImages
              ? "Le fournisseur actuel ne prend pas les images"
              : imageActive
              ? "Activé : une capture de l'écran part avec chaque question. Cliquer pour désactiver."
              : "Joindre une capture de l'écran à chaque question"
          }
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {imageActive ? "Image activée" : "Utiliser l'image"}
        </button>
        <button
          type="button"
          className="ov-send"
          title={isLoading ? "Arrêter" : "Envoyer"}
          onClick={envoyer}
          disabled={!isLoading && (!input.trim() || isScreenshotLoading)}
        >
          {isLoading ? (
            <SquareIcon className="h-3.5 w-3.5" />
          ) : isScreenshotLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
