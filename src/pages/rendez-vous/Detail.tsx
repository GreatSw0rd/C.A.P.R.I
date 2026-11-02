import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { motion } from "motion/react";
import { Trash2Icon, PlayIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components";
import { PageLayout } from "@/layouts";
import { cn } from "@/lib/utils";
import {
  lireRendezVous,
  enregistrerRendezVous,
  marquerEngagement,
  supprimerRendezVous,
  ouvrirOverlay,
  safeLocalStorage,
  type RendezVous,
} from "@/lib";
import { STORAGE_KEYS } from "@/config";
import {
  Bloc,
  BlocEngagements,
  FichePreparation,
  MiniSuivi,
  VueCompteRendu,
  VueSuivi,
} from "./components/Vues";

type Onglet = "compte-rendu" | "preparation" | "suivi" | "propos";

// Detail d'un rendez-vous : compte-rendu (avec e-mail de relance), fiche de preparation,
// suivi SPIN et, replie, ce qu'a dit l'interlocuteur.
const DetailRdv = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rdv, setRdv] = useState<RendezVous | null>(null);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>("compte-rendu");

  useEffect(() => {
    if (!id) return;
    lireRendezVous(id)
      .then((r) => {
        setRdv(r);
        if (r) setOnglet(r.compteRendu ? "compte-rendu" : r.preparation ? "preparation" : "suivi");
      })
      .finally(() => setChargement(false));
  }, [id]);

  // Cocher un engagement : enregistre aussitot, pour le suivi apres le rendez-vous.
  const cocherEngagement = (idEngagement: string, fait: boolean) => {
    setRdv((r) => {
      if (!r?.suivi) return r;
      const maj = { ...r, suivi: marquerEngagement(r.suivi, idEngagement, fait), updatedAt: Date.now() };
      enregistrerRendezVous(maj).catch((e) => console.error("Sauvegarde impossible :", e));
      return maj;
    });
  };

  if (chargement) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!rdv) {
    return (
      <PageLayout allowBackButton title="Rendez-vous introuvable" description="Il a peut-être été supprimé.">
        <span />
      </PageLayout>
    );
  }

  const onglets: { id: Onglet; libelle: string; visible: boolean }[] = [
    { id: "compte-rendu", libelle: "Compte-rendu", visible: !!rdv.compteRendu },
    { id: "preparation", libelle: "Préparation", visible: !!rdv.preparation },
    { id: "suivi", libelle: "Fiche et suivi", visible: rdv.statut !== "prepare" && !!rdv.suivi },
    { id: "propos", libelle: "Ce qui a été dit", visible: rdv.passages.length > 0 },
  ];

  const lancer = async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.RDV_PREPARE_ACTIF, rdv.id);
    await ouvrirOverlay("ecouter");
  };

  return (
    <PageLayout
      sectionCards={false}
      allowBackButton
      title={rdv.entreprise || rdv.titre}
      description={[
        rdv.interlocuteur,
        moment(rdv.debut || rdv.createdAt).format("dddd D MMMM YYYY, HH:mm"),
        rdv.statut === "prepare" ? "préparé" : rdv.statut === "en_cours" ? "en cours" : "terminé",
      ]
        .filter(Boolean)
        .join(" · ")}
      rightSlot={
        <div className="flex items-center gap-2">
          {rdv.statut === "prepare" && (
            <Button onClick={lancer}>
              <PlayIcon className="size-4" />
              Démarrer dans l'overlay
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Supprimer"
            onClick={async () => {
              await supprimerRendezVous(rdv.id);
              navigate("/rendez-vous");
            }}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1">
          {onglets
            .filter((o) => o.visible)
            .map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOnglet(o.id)}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  onglet === o.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {onglet === o.id && (
                  <motion.span
                    layoutId="onglet-rdv"
                    className="absolute inset-0 rounded-lg bg-accent"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{o.libelle}</span>
              </button>
            ))}
        </div>
        {rdv.statut !== "prepare" && <MiniSuivi rdv={rdv} />}
      </div>

      {onglet === "compte-rendu" && rdv.compteRendu && (
        <div className="space-y-3">
          <BlocEngagements engagements={rdv.suivi?.engagements ?? []} onChange={cocherEngagement} />
          <VueCompteRendu rdv={rdv} cr={rdv.compteRendu} />
        </div>
      )}
      {onglet === "preparation" && rdv.preparation && <FichePreparation p={rdv.preparation} />}
      {onglet === "suivi" && rdv.suivi && <VueSuivi suivi={rdv.suivi} onEngagement={cocherEngagement} />}
      {onglet === "propos" && (
        <Bloc titre="Ce qu'a dit l'interlocuteur">
          <div className="space-y-2">
            {rdv.passages.map((p) => (
              <div key={p.heure} className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {moment(p.heure).format("HH:mm")}
                </span>
                <p className="leading-relaxed">{p.texte}</p>
              </div>
            ))}
          </div>
        </Bloc>
      )}
    </PageLayout>
  );
};

export default DetailRdv;
