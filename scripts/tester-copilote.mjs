// Tests de la fiche vivante du copilote (logique pure, sans application).
// Usage : npm run test:copilote
import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dossier = mkdtempSync(join(tmpdir(), "capri-tests-"));
const sortie = join(dossier, "fusion.mjs");
await build({
  entryPoints: [new URL("../src/lib/rdv/fusion.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: sortie,
  logLevel: "silent",
});
const F = await import(pathToFileURL(sortie).href);
writeFileSync(join(dossier, "ok"), "");

let ok = 0;
const test = (nom, fn) => {
  try {
    fn();
    ok++;
    console.log(`  ok   ${nom}`);
  } catch (e) {
    console.log(`  ECHEC ${nom}\n       ${e.message}`);
    process.exitCode = 1;
  }
};
const vide = () => ({ faits: [], questions: [], objections: [], plan: [], cartes: [] });
const analyse = (a) => ({
  operations: [],
  questions_repondues: [],
  plan_couvert: [],
  objections: [],
  action: null,
  ...a,
});

console.log("Citations et parasites");
test("citation exacte acceptee (accents et ponctuation ignores)", () =>
  assert.ok(F.citationValide("des coupures chaque semaine", "Bon, on a des coupures, chaque semaine !")));
test("citation inventee rejetee", () =>
  assert.ok(!F.citationValide("budget de 50 000 euros", "On a des coupures chaque semaine.")));
test("transcription imparfaite toleree", () =>
  assert.ok(F.citationValide("nous avons cent vingt sites", "alors nous avons 120 euh cent vingt sites relies")));
test("phrase parasite de Whisper filtree", () => {
  assert.ok(F.estParasite("Merci d'avoir regardé cette vidéo !"));
  assert.ok(F.estParasite("Sous-titres réalisés par la communauté d'Amara.org"));
  assert.ok(!F.estParasite("Nous avons des coupures chaque semaine."));
});

console.log("Fusion de la fiche");
const passage1 = "Nous avons cent vingt sites relies en ADSL et des coupures chaque semaine.";
const r1 = F.fusionner(
  vide(),
  analyse({
    operations: [
      { op: "ajouter", categorie: "S", valeur: "120 sites en ADSL", citation: "cent vingt sites relies en ADSL" },
      { op: "ajouter", categorie: "P", valeur: "coupures hebdomadaires", citation: "des coupures chaque semaine" },
      { op: "ajouter", categorie: "budget", valeur: "50 k€", citation: "un budget de 50 000 euros" },
    ],
  }),
  passage1,
  1_000
);
test("faits cites ajoutes, fait sans citation valide rejete", () => {
  assert.equal(r1.suivi.faits.length, 2);
  assert.equal(r1.rejetes, 1);
  assert.equal(r1.notes.length, 2);
});
const r2 = F.fusionner(
  r1.suivi,
  analyse({
    operations: [{ op: "ajouter", categorie: "S", valeur: "120 sites relies en ADSL", citation: "120 sites relies" }],
  }),
  "Comme je disais, 120 sites relies.",
  2_000
);
test("doublon fusionne au lieu d'etre ajoute", () => {
  assert.equal(r2.suivi.faits.filter((f) => f.categorie === "S").length, 1);
});
const r3 = F.fusionner(
  r2.suivi,
  analyse({
    operations: [{ op: "ajouter", categorie: "budget", valeur: "50 000 € par an", citation: "50 000 euros par an" }],
  }),
  "On a prevu 50 000 euros par an.",
  3_000
);
const idBudget = r3.suivi.faits.find((f) => f.categorie === "budget").id;
const r4 = F.fusionner(
  r3.suivi,
  analyse({
    operations: [
      { op: "contradiction", id: idBudget, valeur: "rien avant juin", citation: "rien avant juin", question: "Le budget de 50 000 € est-il gelé jusqu'en juin ?" },
    ],
  }),
  "En fait on ne debloquera rien avant juin.",
  60_000
);
test("contradiction : fait a clarifier, ancienne valeur gardee, carte clarifier", () => {
  const b = r4.suivi.faits.find((f) => f.id === idBudget);
  assert.equal(b.statut, "a_clarifier");
  assert.equal(b.avant, "50 000 € par an");
  assert.equal(r4.carte?.type, "clarifier");
  assert.match(r4.carte.note, /Avant/);
});
test("un avis sur le prix n'ecrase pas le montant du budget", () => {
  const r = F.fusionner(
    r3.suivi,
    analyse({ operations: [{ op: "ajouter", categorie: "budget", valeur: "prix jugé trop élevé", citation: "trop cher" }] }),
    "Ca reste trop cher.",
    70_000
  );
  const budgets = r.suivi.faits.filter((f) => f.categorie === "budget").map((f) => f.valeur);
  assert.ok(budgets.includes("50 000 € par an"));
});
test("contradiction resolue : l'ancienne valeur n'est plus affichee", () => {
  const r = F.fusionner(
    r4.suivi,
    analyse({ operations: [{ op: "preciser", id: idBudget, valeur: "rien avant juin, 50 000 € ensuite", citation: "50 000 euros a partir de juin", certitude: "explicite" }] }),
    "Ce sera 50 000 euros a partir de juin.",
    120_000
  );
  const b = r.suivi.faits.find((f) => f.id === idBudget);
  assert.equal(b.statut, "confirme");
  assert.equal(b.avant, undefined);
});
test("information deduite marquee a confirmer", () => {
  const r = F.fusionner(
    vide(),
    analyse({ operations: [{ op: "ajouter", categorie: "decideur", valeur: "DAF", citation: "notre directeur financier", certitude: "deduit" }] }),
    "Il faudra voir avec notre directeur financier.",
    1
  );
  assert.equal(r.suivi.faits[0].statut, "a_confirmer");
});

console.log("Objections et questions");
const rO1 = F.fusionner(
  vide(),
  analyse({
    objections: [{ op: "nouvelle", sujet: "prix trop eleve", citation: "trop cher" }],
    action: { type: "objection", titre: "Prix", dire: "Comparons au cout des coupures.", questions: [] },
  }),
  "C'est trop cher pour nous.",
  1_000
);
const rO2 = F.fusionner(
  rO1.suivi,
  analyse({
    objections: [{ op: "nouvelle", sujet: "prix eleve", citation: "toujours trop cher" }],
    action: { type: "question", titre: "Prix", dire: "Qu'est-ce qui vous parait cher ?", questions: [] },
  }),
  "Mais c'est toujours trop cher.",
  90_000
);
test("objection qui revient : comptee, prioritaire, signalee", () => {
  assert.equal(rO2.suivi.objections.length, 1);
  assert.equal(rO2.suivi.objections[0].occurrences, 2);
  assert.equal(rO2.carte.type, "objection");
  assert.match(rO2.carte.note, /2e fois/);
});
const rQ1 = F.fusionner(
  vide(),
  analyse({ action: { type: "question", titre: "Impact", dire: "", questions: ["Que coute une heure d'arret ?"] } }),
  "On a souvent des pannes.",
  1_000
);
test("question proposee suivie", () => {
  assert.equal(rQ1.suivi.questions.length, 1);
  assert.equal(rQ1.suivi.questions[0].statut, "proposee");
});
const rQ2 = F.fusionner(
  rQ1.suivi,
  analyse({ action: { type: "question", titre: "Impact", dire: "", questions: ["Que coute une heure d'arret ?"] } }),
  "Les pannes durent longtemps.",
  60_000
);
test("question deja suivie jamais reproposee", () => {
  assert.equal(rQ2.carte, null);
});
test("delai de calme : pas de nouvelle question juste apres une carte", () => {
  const r = F.fusionner(
    rQ1.suivi,
    analyse({ action: { type: "question", titre: "Volume", dire: "", questions: ["Combien de colis par jour ?"] } }),
    "On livre beaucoup.",
    5_000
  );
  assert.equal(r.carte, null);
  assert.equal(r.enAttente, true);
});
test("reponse a une question en attente cochee", () => {
  const q = rQ1.suivi.questions[0].id;
  const r = F.fusionner(rQ1.suivi, analyse({ questions_repondues: [q] }), "Une heure d'arret coute 3000 euros.", 70_000);
  assert.equal(r.suivi.questions[0].statut, "repondue");
});

console.log("Retours du commercial");
test("Fait : question posee, objection traitee", () => {
  const s = F.marquerFaite(rO1.suivi, rO1.carte.id);
  assert.equal(s.objections[0].statut, "traitee");
  assert.equal(s.cartes[0].statut, "faite");
});
test("Pas pertinent : suggestion qui ne revient pas", () => {
  const s = F.marquerEcartee(rQ1.suivi, rQ1.carte.id);
  const r = F.fusionner(
    s,
    analyse({ action: { type: "question", titre: "Impact", dire: "", questions: ["Que coute une heure d'arret ?"] } }),
    "Encore des pannes.",
    90_000
  );
  assert.equal(r.carte, null);
});

console.log("Engagements et assistant");
test("engagement note, citation verifiee, sans doublon, echeance completee", () => {
  const passage = "Envoyez-moi une proposition chiffree, je la presente a Monsieur Ferrand.";
  const r1 = F.fusionner(
    vide(),
    analyse({
      engagements: [
        { qui: "nous", texte: "envoyer une proposition chiffrée", echeance: "", citation: "Envoyez-moi une proposition chiffree" },
        { qui: "client", texte: "présenter au DAF", echeance: "", citation: "je la presente a Monsieur Ferrand" },
        { qui: "nous", texte: "envoyer une démo", echeance: "", citation: "une demo vendredi" },
      ],
    }),
    passage,
    1_000
  );
  assert.equal(r1.suivi.engagements.length, 2);
  assert.equal(r1.rejetes, 1);
  const r2 = F.fusionner(
    r1.suivi,
    analyse({ engagements: [{ qui: "nous", texte: "envoyer la proposition chiffrée", echeance: "avant vendredi", citation: "avant vendredi" }] }),
    "Idealement avant vendredi.",
    2_000
  );
  assert.equal(r2.suivi.engagements.length, 2);
  assert.equal(r2.suivi.engagements[0].echeance, "avant vendredi");
  const r3 = { ...r2.suivi, ...F.marquerEngagement(r2.suivi, r2.suivi.engagements[0].id, true) };
  assert.equal(r3.engagements[0].fait, true);
});
test("assistant desactive : fiche a jour, aucune carte", () => {
  const r = F.fusionner(
    vide(),
    analyse({
      operations: [{ op: "ajouter", categorie: "P", valeur: "coupures", citation: "des coupures" }],
      objections: [{ op: "nouvelle", sujet: "prix", citation: "trop cher" }],
      action: { type: "objection", titre: "Prix", dire: "Comparons au cout des coupures.", questions: [] },
    }),
    "On a des coupures, et c'est trop cher.",
    1_000,
    { suggestions: false }
  );
  assert.equal(r.suivi.faits.length, 1);
  assert.equal(r.suivi.objections.length, 1);
  assert.equal(r.carte, null);
});

console.log("Plan de preparation");
test("plan construit et coche", () => {
  const plan = F.planDepuisPreparation({ questions: { S: ["Comment sont relies vos sites ?"], P: [], I: ["Que coute un arret ?"], N: [] } });
  assert.equal(plan.length, 2);
  const s = { ...vide(), plan };
  const r = F.fusionner(s, analyse({ plan_couvert: [plan[0].id] }), "Nos sites sont en ADSL.", 1);
  assert.equal(r.suivi.plan[0].couvert, true);
});

console.log("Lecture de la reponse IA");
test("reponse partielle ou bruitee toleree", () => {
  const a = F.lireAnalyseIA({ operations: [{ op: "ajouter", categorie: "X", valeur: "null" }], action: { type: "zzz", dire: "null", questions: [] } });
  assert.equal(a.operations.length, 0);
  assert.equal(a.action, null);
});

console.log(`\n${ok} tests reussis${process.exitCode ? " (des echecs)" : ""}`);
