import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  CalendarCheckIcon,
  FileTextIcon,
  PlusIcon,
  RadioIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components";
import { PageLayout } from "@/layouts";
import { CarteFx } from "@/components/fx";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  listerRendezVous,
  supprimerRendezVous,
  safeLocalStorage,
  type RendezVous,
} from "@/lib";
import { STORAGE_KEYS } from "@/config";
import { MiniSuivi } from "./components/Vues";
import { ReglagesCopilote } from "./components/ReglagesCopilote";

const duree = (r: RendezVous) =>
  r.debut && r.fin ? `${Math.max(1, Math.round((r.fin - r.debut) / 60000))} min` : "";

// Rendez-vous : preparations a venir, rendez-vous en cours et comptes-rendus.
const RendezVousPage = () => {
  const navigate = useNavigate();
  const [liste, setListe] = useState<RendezVous[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actif, setActif] = useState(safeLocalStorage.getItem(STORAGE_KEYS.RDV_PREPARE_ACTIF));

  const charger = useCallback(async () => {
    try {
      setListe(await listerRendezVous());
    } catch {
      setListe([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
    window.addEventListener("focus", charger);
    return () => window.removeEventListener("focus", charger);
  }, [charger]);

  const utiliser = (id: string) => {
    safeLocalStorage.setItem(STORAGE_KEYS.RDV_PREPARE_ACTIF, id);
    setActif(id);
  };

  const supprimer = async (id: string) => {
    await supprimerRendezVous(id);
    if (actif === id) {
      safeLocalStorage.removeItem(STORAGE_KEYS.RDV_PREPARE_ACTIF);
      setActif(null);
    }
    charger();
  };

  const prepares = liste.filter((r) => r.statut === "prepare");
  const enCours = liste.filter((r) => r.statut === "en_cours");
  const termines = liste.filter((r) => r.statut === "termine");

  return (
    <PageLayout
      sectionCards={false}
      title="Rendez-vous"
      description="Préparez vos rendez-vous, puis retrouvez le compte-rendu et l'e-mail de relance après chaque appel."
      rightSlot={
        <Button onClick={() => navigate("/rendez-vous/nouveau")}>
          <PlusIcon className="size-4" />
          Préparer un rendez-vous
        </Button>
      }
    >
      <ReglagesCopilote />

      {!chargement && liste.length === 0 && (
        <CarteFx className="flex flex-col items-center gap-2 p-10 text-center">
          <CalendarCheckIcon className="size-8 text-muted-foreground" />
          <p className="text-base font-medium">Aucun rendez-vous pour l'instant</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Préparez votre prochain rendez-vous : C.A.P.R.I vous propose un plan de questions
            SPIN et les objections probables. Pendant l'appel, il suit votre avancement et
            rédige le compte-rendu à la fin.
          </p>
          <Button className="mt-2" onClick={() => navigate("/rendez-vous/nouveau")}>
            <PlusIcon className="size-4" />
            Préparer un rendez-vous
          </Button>
        </CarteFx>
      )}

      {enCours.length > 0 && (
        <Section titre="En cours">
          {enCours.map((r, i) => (
            <Ligne key={r.id} r={r} i={i} onOuvrir={() => navigate(`/rendez-vous/${r.id}`)}>
              <span className="flex items-center gap-1.5 text-[11px] text-red-400">
                <RadioIcon className="size-3.5" /> en cours
              </span>
            </Ligne>
          ))}
        </Section>
      )}

      {prepares.length > 0 && (
        <Section titre="Préparés">
          {prepares.map((r, i) => (
            <Ligne key={r.id} r={r} i={i} onOuvrir={() => navigate(`/rendez-vous/${r.id}`)}>
              {actif === r.id ? (
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Prêt pour le prochain appel
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    utiliser(r.id);
                  }}
                  className="rounded-md border border-border bg-secondary/70 px-2 py-0.5 text-[11px] hover:bg-accent"
                >
                  Utiliser au prochain appel
                </button>
              )}
              <BoutonSupprimer onClick={() => supprimer(r.id)} />
            </Ligne>
          ))}
        </Section>
      )}

      {termines.length > 0 && (
        <Section titre="Terminés">
          {termines.map((r, i) => (
            <Ligne key={r.id} r={r} i={i} onOuvrir={() => navigate(`/rendez-vous/${r.id}`)} resume>
              <MiniSuivi rdv={r} />
              <BoutonSupprimer onClick={() => supprimer(r.id)} />
            </Ligne>
          ))}
        </Section>
      )}
    </PageLayout>
  );
};

const Section = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium text-muted-foreground">{titre}</p>
    <div className="grid grid-cols-1 gap-2">{children}</div>
  </div>
);

const BoutonSupprimer = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    title="Supprimer"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
  >
    <Trash2Icon className="size-4" />
  </button>
);

const Ligne = ({
  r,
  i,
  onOuvrir,
  resume,
  children,
}: {
  r: RendezVous;
  i: number;
  onOuvrir: () => void;
  resume?: boolean;
  children?: React.ReactNode;
}) => (
  <BlurFade delay={0.03 * i} blur="3px">
    <CarteFx onClick={onOuvrir} className="group flex items-center gap-3 rounded-xl p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/80">
        <FileTextIcon className="size-4 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {r.entreprise || r.titre}
          {r.interlocuteur && (
            <span className="font-normal text-muted-foreground"> · {r.interlocuteur}</span>
          )}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {moment(r.debut || r.createdAt).format("dddd D MMMM, HH:mm")}
          {duree(r) && ` · ${duree(r)}`}
          {resume && r.compteRendu?.resume && ` · ${r.compteRendu.resume}`}
        </span>
      </span>
      {children}
    </CarteFx>
  </BlurFade>
);

export default RendezVousPage;
