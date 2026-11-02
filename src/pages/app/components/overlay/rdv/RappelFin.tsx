import type { RendezVous } from "@/lib";

/** Ce qu'il reste a couvrir avant de raccrocher (vide si tout est en ordre). */
export function elementsRappel(rdv: RendezVous | null) {
  const s = rdv?.suivi;
  return {
    plan: (s?.plan ?? []).filter((p) => !p.couvert),
    freins: (s?.objections ?? []).filter((o) => o.statut !== "levee" && o.statut !== "traitee"),
    questions: (s?.questions ?? []).filter((q) => q.statut === "posee"),
    engagements: (s?.engagements ?? []).filter((e) => !e.fait),
  };
}

// Rappel affiche au moment de terminer : sujets prepares non abordes, freins encore
// ouverts, questions restees sans reponse et engagements a confirmer avant de raccrocher.
export const RappelFin = ({ rdv }: { rdv: RendezVous | null }) => {
  const { plan, freins, questions, engagements } = elementsRappel(rdv);
  if (!plan.length && !freins.length && !questions.length && !engagements.length) {
    return <p className="text-[11px] ov-muted">Tout le plan est couvert, aucun frein ouvert.</p>;
  }
  return (
    <div className="space-y-1.5 text-[11px] leading-snug">
      <p className="font-semibold">Avant de raccrocher</p>
      {plan.length > 0 && (
        <div>
          <p className="ov-muted">
            {plan.length} question{plan.length > 1 ? "s" : ""} préparée{plan.length > 1 ? "s" : ""} non abordée
            {plan.length > 1 ? "s" : ""}
          </p>
          {plan.slice(0, 3).map((p) => (
            <p key={p.id}>› {p.texte}</p>
          ))}
        </div>
      )}
      {freins.length > 0 && (
        <p>
          <span className="ov-muted">Frein encore ouvert : </span>
          {freins.map((o) => o.sujet).join(", ")}
        </p>
      )}
      {questions.length > 0 && (
        <p>
          <span className="ov-muted">Sans réponse : </span>
          {questions.map((q) => q.texte).slice(0, 2).join(" · ")}
        </p>
      )}
      {engagements.length > 0 && (
        <div>
          <p className="ov-muted">Engagements à reformuler pour conclure</p>
          {engagements.map((e) => (
            <p key={e.id}>
              › {e.qui === "nous" ? "Nous" : "Le client"} : {e.texte}
              {e.echeance ? ` (${e.echeance})` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
