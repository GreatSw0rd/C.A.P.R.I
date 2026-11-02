import { useEffect, useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { ScrollArea } from "@/components";
import { useApp } from "@/contexts";
import { ouvrirTableauDeBord } from "@/lib";
import { useSystemAudioType } from "@/hooks";
import { PermissionFlow } from "../speech/PermissionFlow";
import { raccourci } from "./raccourcis";
import { OrbeCapri } from "@/components/fx/OrbeCapri";
import { BandeauRdv } from "./rdv/BandeauRdv";
import { CarteDuMoment, LigneEtat } from "./rdv/CarteDuMoment";
import { NotesRecentes } from "./rdv/NotesRecentes";
import { Reperes } from "./rdv/Reperes";
import { BarreCapture } from "./rdv/BarreCapture";
import { AvantRdv } from "./rdv/AvantRdv";
import { FinRdv } from "./rdv/FinRdv";
import { RappelFin } from "./rdv/RappelFin";

// Vue "Ecouter" : copilote de rendez-vous. Le commercial capte ce que dit son interlocuteur
// (mode manuel) ; C.A.P.R.I n'affiche une carte que si le passage apporte quelque chose.
// Aucune transcription a l'ecran : uniquement ce qu'il faut dire ou demander.
export const ListenView = (props: useSystemAudioType) => {
  const {
    capturing,
    isProcessing,
    isAIProcessing,
    error,
    setupRequired,
    startCapture,
    isRecordingInContinuousMode,
    recordingProgress,
    manualStopAndSend,
    startContinuousRecording,
    ignoreContinuousRecording,
    scrollAreaRef,
    suivi,
    terminerRdv,
  } = props;

  const { selectedSttProvider } = useApp();
  const touche = raccourci("system_audio");
  const rdv = suivi.rdv;
  const cartes = rdv?.suivi?.cartes ?? [];
  const visibles = suivi.assistant ? cartes.filter((c) => c.statut !== "ecartee") : [];

  // Terminer demande une confirmation (evite un clic accidentel en plein appel) et rappelle
  // ce qu'il reste a couvrir : le commercial a le temps de lire avant que ca se referme.
  const [confirmer, setConfirmer] = useState(false);
  useEffect(() => {
    if (!confirmer) return;
    const t = setTimeout(() => setConfirmer(false), 15000);
    return () => clearTimeout(t);
  }, [confirmer]);

  const occupe = isProcessing || isAIProcessing || suivi.enAnalyse;
  const messageErreur = error || suivi.erreurRdv;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {capturing && rdv && (
        <BandeauRdv
          rdv={rdv}
          desactive={suivi.enCompteRendu}
          assistant={suivi.assistant}
          onAssistant={suivi.definirAssistant}
          onTerminer={() => (confirmer ? (setConfirmer(false), terminerRdv()) : setConfirmer(true))}
        />
      )}
      {confirmer && (
        <div className="shrink-0 space-y-2 px-3 py-2 text-xs border-b ov-divider">
          <RappelFin rdv={rdv} />
          <div className="flex items-center justify-end gap-2">
            <span className="ov-muted">Terminer et rédiger le compte-rendu ?</span>
            <button type="button" className="ov-chip" onClick={() => setConfirmer(false)}>
              Continuer
            </button>
            <button
              type="button"
              className="ov-chip"
              data-active
              onClick={() => {
                setConfirmer(false);
                terminerRdv();
              }}
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-3 space-y-2">
          {!selectedSttProvider.provider && (
            <div className="ov-input flex items-start gap-2 p-3 text-xs">
              <AlertCircleIcon
                className="h-4 w-4 shrink-0"
                style={{ color: "rgb(var(--ov-warn))" }}
              />
              <div className="flex-1">
                <p className="font-medium">Transcription non configurée</p>
                <p className="ov-muted mt-0.5">
                  Pour écouter, choisissez un fournisseur de transcription (STT), par
                  exemple Groq Whisper avec votre clé Groq.
                </p>
                <button
                  type="button"
                  className="ov-chip mt-2"
                  onClick={() => ouvrirTableauDeBord("/dev-space")}
                >
                  Configurer
                </button>
              </div>
            </div>
          )}

          {messageErreur && !setupRequired && (
            <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-2.5 text-xs text-red-300">
              <AlertCircleIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{messageErreur}</span>
            </div>
          )}

          {setupRequired ? (
            <PermissionFlow
              onPermissionGranted={() => startCapture()}
              onPermissionDenied={() => {}}
            />
          ) : suivi.enCompteRendu || suivi.dernierCompteRendu ? (
            <FinRdv
              enCours={suivi.enCompteRendu}
              id={suivi.dernierCompteRendu?.id}
              compteRendu={suivi.dernierCompteRendu?.compteRendu}
              onFermer={suivi.fermerCompteRendu}
            />
          ) : !capturing ? (
            <AvantRdv
              touche={touche}
              onDemarrer={(id) => startCapture(id)}
              assistant={suivi.assistant}
              onAssistant={suivi.definirAssistant}
            />
          ) : (
            <>
              {/* Une seule ligne d'etat : analyse en cours, infos notees, ou retour discret */}
              <div className="flex h-7 items-center">
                {suivi.enAnalyse || isProcessing || !suivi.notes.length ? (
                  <LigneEtat enAnalyse={suivi.enAnalyse || isProcessing} retour={suivi.retour} />
                ) : (
                  <NotesRecentes notes={suivi.notes} />
                )}
              </div>
              {visibles.length === 0 ? (
                <div className="flex flex-col items-center gap-1 py-2 text-center select-none">
                  <OrbeCapri className="size-20 -my-1" />
                  <p className="text-sm">{suivi.assistant ? "À l'écoute" : "Prise de notes"}</p>
                  <p className="max-w-sm text-xs ov-muted">
                    {suivi.assistant
                      ? "Captez un passage quand votre interlocuteur parle. C.A.P.R.I tient la fiche à jour et ne vous souffle qu'une chose à la fois, si elle vous aide."
                      : "Assistant désactivé : C.A.P.R.I note ce que dit votre interlocuteur et rédige le compte-rendu, sans suggestion pendant l'appel."}
                  </p>
                </div>
              ) : (
                <CarteDuMoment
                  cartes={cartes}
                  enAnalyse={suivi.enAnalyse || isProcessing}
                  onRetour={suivi.retourCarte}
                />
              )}
              {rdv && <Reperes rdv={rdv} />}
            </>
          )}
        </div>
      </ScrollArea>

      {capturing && !setupRequired && (
        <BarreCapture
          enregistre={isRecordingInContinuousMode}
          occupe={occupe}
          progression={recordingProgress}
          touche={touche}
          onCapter={startContinuousRecording}
          onEnvoyer={manualStopAndSend}
          onAnnuler={ignoreContinuousRecording}
        />
      )}
    </div>
  );
};
