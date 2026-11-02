import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDownIcon, CompassIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLES_QUALIF,
  ETAPES_SPIN,
  NOM_CATEGORIE,
  NOMS_QUALIF,
  NOMS_SPIN,
  qualifDe,
  type CategorieFait,
  type Fait,
  type RendezVous,
} from "@/lib";
import { prochaineEtape } from "./BandeauRdv";
import { COULEUR_STATUT } from "./NotesRecentes";

type Onglet = "fiche" | "suivre" | "plan";

const LIBELLE_STATUT: Record<Fait["statut"], string> = {
  confirme: "",
  a_confirmer: "à confirmer",
  a_clarifier: "à clarifier",
};

// Un fait de la fiche : valeur, statut ; un clic montre la citation exacte du client.
const LigneFait = ({ f }: { f: Fait }) => {
  const [citation, setCitation] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setCitation((c) => !c)}
      className="flex w-full gap-1.5 text-left leading-snug"
    >
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: `rgb(${COULEUR_STATUT[f.statut]})` }}
      />
      <span className="min-w-0">
        <span>{f.valeur}</span>
        {LIBELLE_STATUT[f.statut] && (
          <span className="ml-1 text-[10px]" style={{ color: `rgb(${COULEUR_STATUT[f.statut]})` }}>
            {LIBELLE_STATUT[f.statut]}
          </span>
        )}
        {f.avant && <span className="block text-[10px] ov-muted">avant : {f.avant}</span>}
        {citation && <span className="block text-[11px] italic ov-muted">« {f.citation} »</span>}
      </span>
    </button>
  );
};

const Groupe = ({ titre, faits, vide }: { titre: string; faits: Fait[]; vide?: string }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold">{titre}</p>
    {faits.length ? (
      faits.map((f) => <LigneFait key={f.id} f={f} />)
    ) : (
      <p className="text-[11px] ov-muted">{vide || "—"}</p>
    )}
  </div>
);

// Reperes (replies par defaut) : la fiche vivante, ce qu'il reste a suivre et le plan.
export const Reperes = ({ rdv }: { rdv: RendezVous }) => {
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("fiche");
  const s = rdv.suivi;
  const faits = s?.faits ?? [];
  const qualif = qualifDe(s);
  const prochaine = prochaineEtape(rdv);
  const aSuivreQ = (s?.questions ?? []).filter((q) => q.statut === "proposee" || q.statut === "posee");
  const aSuivreO = (s?.objections ?? []).filter((o) => o.statut !== "levee");
  const engagements = s?.engagements ?? [];
  const plan = s?.plan ?? [];
  const couverts = plan.filter((p) => p.couvert).length;
  const aClarifier = faits.filter((f) => f.statut === "a_clarifier").length;
  const parCat = (c: CategorieFait) => faits.filter((f) => f.categorie === c);

  const onglets: { id: Onglet; libelle: string; visible: boolean }[] = [
    { id: "fiche", libelle: `Fiche ${faits.length}`, visible: true },
    {
      id: "suivre",
      libelle: `À suivre ${aSuivreQ.length + aSuivreO.length + engagements.length}`,
      visible: true,
    },
    { id: "plan", libelle: `Plan ${couverts}/${plan.length}`, visible: plan.length > 0 },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="flex w-full items-center gap-1.5 text-[11px] ov-muted hover:opacity-80"
      >
        <CompassIcon className="h-3 w-3" />
        <span className="font-medium">Repères</span>
        <span>· {faits.length} infos</span>
        {aClarifier > 0 && (
          <span style={{ color: "rgb(var(--ov-warn))" }}>· {aClarifier} à clarifier</span>
        )}
        {aSuivreQ.length + aSuivreO.length > 0 && (
          <span>· {aSuivreQ.length + aSuivreO.length} à suivre</span>
        )}
        {engagements.length > 0 && (
          <span>
            · {engagements.length} engagement{engagements.length > 1 ? "s" : ""}
          </span>
        )}
        {plan.length > 0 && <span>· plan {couverts}/{plan.length}</span>}
        {prochaine && (
          <span>
            · prochaine étape <b className="font-semibold">{NOMS_SPIN[prochaine]}</b>
          </span>
        )}
        <span className="flex-1" />
        <ChevronDownIcon className={cn("h-3 w-3 transition-transform", ouvert && "rotate-180")} />
      </button>

      {ouvert && (
        <div className="mt-2 space-y-2">
          <div className="ov-group w-fit">
            {onglets
              .filter((o) => o.visible)
              .map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="ov-pill relative !h-6 !px-2.5 !text-[11px]"
                  onClick={() => setOnglet(o.id)}
                >
                  {onglet === o.id && (
                    <motion.span
                      layoutId="onglet-reperes"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "rgb(var(--ov-surface-active))" }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{o.libelle}</span>
                </button>
              ))}
          </div>

          <div className="rounded-lg p-2.5 text-xs" style={{ background: "rgb(var(--ov-surface))" }}>
            {onglet === "fiche" && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="space-y-2">
                  {ETAPES_SPIN.map((e) => (
                    <Groupe key={e} titre={NOMS_SPIN[e]} faits={parCat(e)} vide="non abordé" />
                  ))}
                </div>
                <div className="space-y-2">
                  {CLES_QUALIF.map((c) => (
                    <Groupe
                      key={c}
                      titre={NOMS_QUALIF[c]}
                      faits={parCat(c)}
                      vide={qualif[c] || "à découvrir"}
                    />
                  ))}
                  <p className="pt-1 text-[10px] ov-muted">Cliquez sur une info pour voir la phrase exacte du client.</p>
                </div>
              </div>
            )}

            {onglet === "suivre" && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold tracking-wider ov-muted">ENGAGEMENTS</p>
                {engagements.length ? (
                  engagements.map((e) => (
                    <p key={e.id} className="leading-snug" title={`« ${e.citation} »`}>
                      <span className="ov-muted">{e.qui === "nous" ? "À faire" : "Le client"} · </span>
                      <span className="font-medium">{e.texte}</span>
                      {e.echeance && <span className="ov-muted"> · {e.echeance}</span>}
                    </p>
                  ))
                ) : (
                  <p className="ov-muted">Aucune promesse notée pour l'instant.</p>
                )}
                <p className="pt-1 text-[10px] font-semibold tracking-wider ov-muted">FREINS</p>
                {aSuivreO.length ? (
                  aSuivreO.map((o) => (
                    <p key={o.id} className="leading-snug">
                      <span className="font-medium">{o.sujet}</span>
                      <span className="ov-muted">
                        {" "}
                        · {o.statut === "traitee" ? "parade donnée" : o.statut === "persistante" ? `revenu ${o.occurrences} fois` : "à traiter"}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="ov-muted">Aucun frein ouvert.</p>
                )}
                <p className="pt-1 text-[10px] font-semibold tracking-wider ov-muted">QUESTIONS EN ATTENTE DE RÉPONSE</p>
                {aSuivreQ.length ? (
                  aSuivreQ.map((q) => (
                    <p key={q.id} className="leading-snug">
                      › {q.texte}
                      <span className="ov-muted"> · {q.statut === "posee" ? "posée" : "proposée"}</span>
                    </p>
                  ))
                ) : (
                  <p className="ov-muted">Rien en attente.</p>
                )}
              </div>
            )}

            {onglet === "plan" && (
              <div className="space-y-2">
                <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgb(var(--ov-surface-hover))" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${plan.length ? (couverts / plan.length) * 100 : 0}%`,
                      background: "rgb(var(--ov-accent))",
                    }}
                  />
                </div>
                {ETAPES_SPIN.map((e) => {
                  const items = plan.filter((p) => p.etape === e);
                  if (!items.length) return null;
                  return (
                    <div key={e} className="space-y-0.5">
                      <p className="text-[11px] font-semibold">{NOM_CATEGORIE[e]}</p>
                      {items.map((p) => (
                        <p key={p.id} className={cn("flex gap-1.5 leading-snug", p.couvert && "ov-muted line-through")}>
                          <span
                            className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded"
                            style={{
                              background: p.couvert ? "rgb(var(--ov-accent))" : "rgb(var(--ov-surface-hover))",
                            }}
                          >
                            {p.couvert && <CheckIcon className="h-2.5 w-2.5 text-[rgb(20_24_18)]" />}
                          </span>
                          {p.texte}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
