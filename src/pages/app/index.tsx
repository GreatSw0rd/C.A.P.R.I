import { useEffect, useRef, useState } from "react";
import { CustomCursor } from "@/components";
import { Completion, SizeSelector } from "./components";
import {
  OverlayHeader,
  OverlayView,
  HomeView,
  ListenView,
} from "./components/overlay";
import { useApp } from "@/hooks";
import { useApp as useAppContext } from "@/contexts";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorLayout } from "@/layouts";
import { getPlatform, safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";
import { listen } from "@tauri-apps/api/event";
import {
  definirDrapeau,
  demarrerDiffusion,
  signalerAudio,
  signalerImpulsion,
} from "@/lib/capri-activite";

function vueInitiale(): OverlayView {
  const v = safeLocalStorage.getItem(STORAGE_KEYS.OVERLAY_DEFAULT_TAB);
  return v === "listen" || v === "home" ? v : "ask";
}

const App = () => {
  const { isHidden, systemAudio } = useApp();
  const { customizable } = useAppContext();
  const platform = getPlatform();
  const [view, setView] = useState<OverlayView>(vueInitiale);

  // Quand l'ecoute demarre (bouton ou raccourci), on bascule sur l'onglet Ecouter.
  const capturaitAvant = useRef(systemAudio.capturing);
  useEffect(() => {
    if (systemAudio.capturing && !capturaitAvant.current) {
      setView("listen");
    }
    capturaitAvant.current = systemAudio.capturing;
  }, [systemAudio.capturing]);

  // Activite de l'orbe : ecoute, reflexion et reponse en mode Ecouter.
  const { capturing, isAIProcessing, lastAIResponse } = systemAudio;
  useEffect(() => {
    definirDrapeau("ecoute", capturing, "ecouter");
    definirDrapeau("reflexion", isAIProcessing && !lastAIResponse, "ecouter");
    definirDrapeau("reponse", isAIProcessing && !!lastAIResponse, "ecouter");
  }, [capturing, isAIProcessing, lastAIResponse]);
  useEffect(() => {
    if (lastAIResponse) signalerImpulsion(0.3);
  }, [lastAIResponse]);
  useEffect(() => {
    demarrerDiffusion();
    // Volume du son de l'ordinateur (voix de l'interlocuteur), envoye par Rust.
    const un = listen<number>("niveau-audio", (e) => signalerAudio(e.payload));
    return () => {
      un.then((fn) => fn());
    };
  }, []);

  // Actions envoyees par le tableau de bord ("Lancer l'ecoute", "Demander").
  const audioRef = useRef(systemAudio);
  audioRef.current = systemAudio;
  useEffect(() => {
    const ecouter = listen("overlay-ecouter", () => {
      setView("listen");
      if (!audioRef.current.capturing) audioRef.current.startCapture();
    });
    const demander = listen("overlay-demander", () => setView("ask"));
    return () => {
      ecouter.then((fn) => fn());
      demander.then((fn) => fn());
    };
  }, []);

  return (
    <ErrorBoundary
      fallbackRender={() => <ErrorLayout isCompact />}
      resetKeys={["app-error"]}
      onReset={() => {}}
    >
      <div
        className={`dark w-screen h-screen overflow-hidden p-0.5 ${
          isHidden ? "hidden pointer-events-none" : ""
        }`}
      >
        <div className="souffleur-overlay h-full flex flex-col overflow-hidden">
          <OverlayHeader
            view={view}
            setView={setView}
            capturing={systemAudio.capturing}
          />

          {view === "home" && (
            <HomeView
              onAsk={() => setView("ask")}
              onListen={() => {
                setView("listen");
                if (!systemAudio.capturing) systemAudio.startCapture();
              }}
            />
          )}

          {/* Toujours monte pour garder la conversation et les raccourcis. */}
          <Completion
            isHidden={isHidden}
            hidden={view !== "ask"}
          />

          {view === "listen" && <ListenView {...systemAudio} />}

          <SizeSelector />
        </div>

        {customizable.cursor.type === "invisible" && platform !== "linux" ? (
          <CustomCursor />
        ) : null}
      </div>
    </ErrorBoundary>
  );
};

export default App;
