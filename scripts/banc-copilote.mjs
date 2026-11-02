// Banc de mesure du copilote : rejoue des conversations types avec une vraie IA et mesure
// ce qui compte pour le commercial (informations retenues, inventions bloquees, doublons,
// cartes inutiles, objections manquees, rapidite).
//
// Usage (API compatible OpenAI, Groq par defaut) :
//   BANC_CLE=gsk_... npm run banc:copilote
//   BANC_CLE=... BANC_URL=https://api.openai.com/v1/chat/completions BANC_MODELE=gpt-4o-mini npm run banc:copilote
import { build } from "esbuild";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const URL_API = process.env.BANC_URL || "https://api.groq.com/openai/v1/chat/completions";
const MODELE = process.env.BANC_MODELE || "llama-3.3-70b-versatile";
const CLE = process.env.BANC_CLE || process.env.GROQ_API_KEY || "";
if (!CLE && !process.env.BANC_URL) {
  console.error("Indiquez une cle : BANC_CLE=... npm run banc:copilote");
  process.exit(1);
}

// Meme logique que l'application : consignes et fusion compilees depuis les sources.
const dossier = mkdtempSync(join(tmpdir(), "capri-banc-"));
const sortie = join(dossier, "copilote.mjs");
const entree = join(dossier, "entree.ts");
const racine = new URL("../src/lib/rdv/", import.meta.url).pathname;
await import("node:fs").then(({ writeFileSync }) =>
  writeFileSync(entree, `export * from "${racine}consignes";\nexport * from "${racine}fusion";\nexport * from "${racine}types";\n`)
);
await build({ entryPoints: [entree], bundle: true, format: "esm", platform: "node", outfile: sortie, logLevel: "silent" });
const C = await import(pathToFileURL(sortie).href);

const scenarios = JSON.parse(readFileSync(new URL("./scenarios-copilote.json", import.meta.url), "utf8"));

async function appeler(message) {
  const t0 = Date.now();
  const r = await fetch(URL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${CLE}` },
    body: JSON.stringify({
      model: MODELE,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: C.CONSIGNE_ANALYSE },
        { role: "user", content: message },
      ],
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} : ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return { texte: j.choices?.[0]?.message?.content || "", ms: Date.now() - t0 };
}

const extraire = (t) => {
  const s = (t || "").replace(/```(?:json)?/gi, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  try {
    return a >= 0 && b > a ? JSON.parse(s.slice(a, b + 1)) : null;
  } catch {
    return null;
  }
};

const total = { attendus: 0, retenus: 0, rejetes: 0, doublons: 0, cartesInutiles: 0, objectionsManquees: 0, jsonInvalides: 0, latences: [], cartes: 0 };

for (const sc of scenarios) {
  console.log(`\n=== ${sc.nom}`);
  let suivi = C.suiviVide();
  let horloge = 0;
  for (const p of sc.passages) {
    horloge += 60_000; // un passage par minute : le delai de calme n'interfere pas
    let analyse = { operations: [], questions_repondues: [], plan_couvert: [], objections: [], action: null };
    let ms = 0;
    try {
      const rep = await appeler(C.construireMessageAnalyse({ passage: p.texte, suivi, preparation: null }));
      ms = rep.ms;
      const j = extraire(rep.texte);
      if (!j) total.jsonInvalides++;
      else analyse = C.lireAnalyseIA(j);
    } catch (e) {
      console.log(`  ! appel en echec : ${e.message}`);
      total.jsonInvalides++;
    }
    total.latences.push(ms);
    const res = C.fusionner(suivi, analyse, p.texte, horloge);
    suivi = res.suivi;
    total.rejetes += res.rejetes;
    if (res.carte) total.cartes++;

    // Informations attendues retenues ?
    for (const att of p.faits) {
      total.attendus++;
      const trouve = suivi.faits.some(
        (f) => f.categorie === att.categorie && att.contient.some((m) => C.normaliser(f.valeur).includes(C.normaliser(m)))
      );
      if (trouve) total.retenus++;
      else console.log(`  - non retenu : ${att.categorie} (${att.contient.join(" / ")})`);
    }
    // Carte attendue ?
    const type = res.carte?.type ?? "aucune";
    if (p.carte === "aucune" && res.carte) total.cartesInutiles++;
    if (p.carte === "objection" && type !== "objection") total.objectionsManquees++;
    if (p.carte === "clarifier_ou_objection" && !["clarifier", "objection"].includes(type)) total.objectionsManquees++;
    console.log(
      `  [${ms} ms] carte : ${type}${res.carte ? ` (« ${res.carte.titre} »)` : ""} · faits : ${suivi.faits.length} · rejetes : ${res.rejetes}`
    );
  }
  // Doublons dans la fiche finale.
  for (let i = 0; i < suivi.faits.length; i++)
    for (let j = i + 1; j < suivi.faits.length; j++) {
      const a = suivi.faits[i];
      const b = suivi.faits[j];
      if (a.categorie === b.categorie && C.similarite(a.valeur, b.valeur) >= 0.6) total.doublons++;
    }
}

const moy = total.latences.length ? Math.round(total.latences.reduce((a, b) => a + b, 0) / total.latences.length) : 0;
console.log("\n=== Resultats");
console.log(`Informations retenues     : ${total.retenus}/${total.attendus}`);
console.log(`Inventions bloquees       : ${total.rejetes} (citations absentes du passage)`);
console.log(`Doublons dans la fiche    : ${total.doublons}`);
console.log(`Cartes affichees          : ${total.cartes}`);
console.log(`Cartes inutiles           : ${total.cartesInutiles}`);
console.log(`Objections manquees       : ${total.objectionsManquees}`);
console.log(`Reponses illisibles       : ${total.jsonInvalides}`);
console.log(`Temps de reponse moyen    : ${moy} ms (${MODELE})`);
