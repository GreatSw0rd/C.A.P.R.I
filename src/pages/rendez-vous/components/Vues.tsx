import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLES_QUALIF,
  ETAPES_SPIN,
  NOMS_QUALIF,
  NOMS_SPIN,
  NOM_CATEGORIE,
  spinDe,
  qualifDe,
  type CompteRendu,
  type Engagement,
  type Suivi,
  type Preparation,
  type RendezVous,
} from "@/lib";

// Petits blocs reutilises par les pages Rendez-vous (fiche, compte-rendu, suivi).

export const Bloc = ({
  titre,
  children,
  className,
}: {
  titre: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-2 rounded-xl border border-border bg-card/70 p-4", className)}>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {titre}
    </p>
    {children}
  </div>
);

const Puces = ({ items, vide }: { items: string[]; vide?: string }) =>
  items.length ? (
    <ul className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i} className="flex gap-2 leading-snug">
          <span className="text-primary">›</span>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">{vide || "—"}</p>
  );

export const BoutonCopier = ({ texte, libelle }: { texte: string; libelle: string }) => {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        } catch {
          /* presse-papiers indisponible */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-1 text-xs transition-colors hover:bg-accent"
    >
      {ok ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {ok ? "Copié" : libelle}
    </button>
  );
};

/** Pastilles SPIN + jauge de qualification (resume visuel d'un rendez-vous). */
export const MiniSuivi = ({ rdv }: { rdv: RendezVous }) => {
  const spin = spinDe(rdv.suivi);
  const q = rdv.compteRendu?.qualification ?? qualifDe(rdv.suivi);
  const nb = CLES_QUALIF.filter((c) => q?.[c]).length;
  const aFaire = (rdv.suivi?.engagements ?? []).filter((e) => e.qui === "nous" && !e.fait).length;
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {ETAPES_SPIN.map((e) => (
          <span
            key={e}
            title={NOMS_SPIN[e]}
            className={cn(
              "flex size-5 items-center justify-center rounded-md text-[10px] font-bold",
              (spin?.[e].length ?? 0) > 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {e}
          </span>
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums">Qualif. {nb}/4</span>
      {aFaire > 0 && (
        <span className="text-[11px] tabular-nums text-amber-500">
          {aFaire} engagement{aFaire > 1 ? "s" : ""} à faire
        </span>
      )}
    </div>
  );
};

export const FichePreparation = ({ p }: { p: Preparation }) => (
  <div className="space-y-3">
    {(p.resume || p.objectif) && (
      <Bloc titre="En bref">
        {p.resume && <p className="text-sm leading-relaxed">{p.resume}</p>}
        {p.objectif && (
          <p className="text-sm">
            <span className="font-medium">Objectif : </span>
            {p.objectif}
          </p>
        )}
      </Bloc>
    )}
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Bloc titre="Besoins probables (à vérifier)">
        <Puces items={p.besoins} />
      </Bloc>
      <Bloc titre="Points à mettre en avant">
        <Puces items={p.points_cles} />
      </Bloc>
    </div>
    <Bloc titre="Questions SPIN préparées">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ETAPES_SPIN.map((e) => (
          <div key={e} className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="flex size-5 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                {e}
              </span>
              {NOMS_SPIN[e]}
            </p>
            <Puces items={p.questions?.[e] ?? []} />
          </div>
        ))}
      </div>
    </Bloc>
    {p.objections.length > 0 && (
      <Bloc titre="Objections probables">
        <div className="space-y-2">
          {p.objections.map((o) => (
            <div key={o.objection} className="text-sm">
              <p className="font-medium">« {o.objection} »</p>
              <p className="text-muted-foreground">→ {o.parade}</p>
            </div>
          ))}
        </div>
      </Bloc>
    )}
  </div>
);

export const texteCompteRendu = (rdv: RendezVous, cr: CompteRendu) =>
  [
    `Compte-rendu : ${rdv.entreprise || rdv.titre}`,
    rdv.debut ? new Date(rdv.debut).toLocaleString("fr-FR") : "",
    "",
    cr.resume,
    "",
    "Besoins :",
    ...cr.besoins.map((b) => `- ${b}`),
    "",
    "Qualification :",
    ...CLES_QUALIF.map((c) => `- ${NOMS_QUALIF[c]} : ${cr.qualification[c] || "à découvrir"}`),
    "",
    "Objections :",
    ...cr.objections.map((o) => `- ${o.objection} → ${o.reponse}`),
    "",
    "Prochaines étapes :",
    ...cr.prochaines_etapes.map((e) => `- ${e}`),
  ]
    .filter((l, i, t) => !(l === "" && t[i - 1] === ""))
    .join("\n");

export const VueCompteRendu = ({ rdv, cr }: { rdv: RendezVous; cr: CompteRendu }) => (
  <div className="space-y-3">
    <Bloc titre="Résumé">
      <p className="text-sm leading-relaxed">{cr.resume || "—"}</p>
      <div className="pt-1">
        <BoutonCopier texte={texteCompteRendu(rdv, cr)} libelle="Copier pour le CRM" />
      </div>
    </Bloc>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Bloc titre="Besoins identifiés">
        <Puces items={cr.besoins} />
      </Bloc>
      <Bloc titre="Qualification">
        <div className="grid grid-cols-2 gap-2">
          {CLES_QUALIF.map((c) => (
            <div key={c} className="rounded-lg bg-secondary/60 p-2">
              <p className="text-[11px] text-muted-foreground">{NOMS_QUALIF[c]}</p>
              <p className={cn("text-sm", !cr.qualification[c] && "text-muted-foreground")}>
                {cr.qualification[c] || "à découvrir"}
              </p>
            </div>
          ))}
        </div>
      </Bloc>
    </div>
    {cr.objections.length > 0 && (
      <Bloc titre="Objections">
        <div className="space-y-2">
          {cr.objections.map((o) => (
            <div key={o.objection} className="text-sm">
              <p className="font-medium">« {o.objection} »</p>
              <p className="text-muted-foreground">→ {o.reponse || "à traiter"}</p>
            </div>
          ))}
        </div>
      </Bloc>
    )}
    <Bloc titre="Prochaines étapes">
      <Puces items={cr.prochaines_etapes} vide="Aucune étape notée." />
    </Bloc>
    {cr.email.corps && (
      <Bloc titre="E-mail de relance">
        <p className="text-sm font-medium">{cr.email.objet}</p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {cr.email.corps}
        </p>
        <BoutonCopier
          texte={`Objet : ${cr.email.objet}\n\n${cr.email.corps}`}
          libelle="Copier l'e-mail"
        />
      </Bloc>
    )}
  </div>
);

const STATUT_FAIT: Record<string, { libelle: string; classe: string }> = {
  confirme: { libelle: "", classe: "bg-emerald-400" },
  a_confirmer: { libelle: "à confirmer", classe: "bg-zinc-400" },
  a_clarifier: { libelle: "à clarifier", classe: "bg-amber-400" },
};

/** Engagements pris pendant l'appel, a cocher une fois faits. */
export const BlocEngagements = ({
  engagements,
  onChange,
}: {
  engagements: Engagement[];
  onChange?: (id: string, fait: boolean) => void;
}) => {
  if (!engagements.length) return null;
  const restants = engagements.filter((e) => e.qui === "nous" && !e.fait).length;
  const groupes: { qui: Engagement["qui"]; titre: string }[] = [
    { qui: "nous", titre: "À faire de notre côté" },
    { qui: "client", titre: "Promis par le client" },
  ];
  return (
    <Bloc
      titre={`Engagements (${restants ? `${restants} à faire de notre côté` : "rien à faire de notre côté"})`}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {groupes.map(({ qui, titre }) => {
          const liste = engagements.filter((e) => e.qui === qui);
          if (!liste.length) return null;
          return (
            <div key={qui} className="space-y-1.5">
              <p className="text-sm font-medium">{titre}</p>
              {liste.map((e) => (
                <label key={e.id} className="flex cursor-pointer gap-2 text-sm leading-snug">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                    checked={e.fait}
                    disabled={!onChange}
                    onChange={(ev) => onChange?.(e.id, ev.target.checked)}
                  />
                  <span className={cn(e.fait && "text-muted-foreground line-through")}>
                    {e.texte}
                    {e.echeance && <span className="text-muted-foreground"> · {e.echeance}</span>}
                    <span className="block text-xs italic text-muted-foreground">« {e.citation} »</span>
                  </span>
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </Bloc>
  );
};

/** Suivi complet : fiche avec citations, freins, questions et plan de preparation. */
export const VueSuivi = ({
  suivi,
  onEngagement,
}: {
  suivi: Suivi;
  onEngagement?: (id: string, fait: boolean) => void;
}) => {
  const groupes = [...ETAPES_SPIN, ...CLES_QUALIF] as const;
  const questions = suivi.questions.filter((q) => q.statut !== "ecartee");
  const couverts = suivi.plan.filter((p) => p.couvert).length;
  return (
    <div className="space-y-3">
      <BlocEngagements engagements={suivi.engagements ?? []} onChange={onEngagement} />
      <Bloc titre={`Fiche du rendez-vous (${suivi.faits.length} informations)`}>
        {suivi.faits.length === 0 && (suivi.spin || suivi.qualification) ? (
          <p className="text-sm text-muted-foreground">Rendez-vous enregistré avant la fiche détaillée.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {groupes.map((c) => {
              const faits = suivi.faits.filter((f) => f.categorie === c);
              return (
                <div key={c} className="space-y-1">
                  <p className="text-sm font-medium">{NOM_CATEGORIE[c]}</p>
                  {faits.length ? (
                    faits.map((f) => (
                      <div key={f.id} className="flex gap-2 text-sm leading-snug">
                        <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", STATUT_FAIT[f.statut].classe)} />
                        <span>
                          {f.valeur}
                          {STATUT_FAIT[f.statut].libelle && (
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              ({STATUT_FAIT[f.statut].libelle}{f.avant ? `, avant : ${f.avant}` : ""})
                            </span>
                          )}
                          <span className="block text-xs italic text-muted-foreground">« {f.citation} »</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Non abordé</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Bloc>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Bloc titre="Freins">
          {suivi.objections.length ? (
            suivi.objections.map((o) => (
              <div key={o.id} className="text-sm">
                <p>
                  <span className="font-medium">{o.sujet}</span>
                  <span className="text-muted-foreground">
                    {" "}· {o.statut === "levee" ? "levé" : o.statut === "traitee" ? "parade donnée" : o.statut === "persistante" ? `revenu ${o.occurrences} fois` : "non traité"}
                  </span>
                </p>
                {o.citation && <p className="text-xs italic text-muted-foreground">« {o.citation} »</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucun frein exprimé.</p>
          )}
        </Bloc>
        <Bloc titre="Questions suggérées">
          {questions.length ? (
            questions.map((q) => (
              <p key={q.id} className="text-sm leading-snug">
                › {q.texte}
                <span className="text-muted-foreground">
                  {" "}· {q.statut === "repondue" ? "répondue" : q.statut === "posee" ? "posée, sans réponse" : "non posée"}
                </span>
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucune.</p>
          )}
        </Bloc>
      </div>
      {suivi.plan.length > 0 && (
        <Bloc titre={`Plan de préparation (${couverts}/${suivi.plan.length} couverts)`}>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {suivi.plan.map((p) => (
              <p key={p.id} className={cn("text-sm", p.couvert ? "text-muted-foreground line-through" : "")}>
                <span className="mr-1 text-xs font-bold text-primary">{p.etape}</span>
                {p.texte}
              </p>
            ))}
          </div>
        </Bloc>
      )}
    </div>
  );
};
