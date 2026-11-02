import { getDatabase } from "./config";
import type {
  RendezVous,
  StatutRdv,
  Preparation,
  Suivi,
  Passage,
  CompteRendu,
} from "../rdv/types";
import { normaliserSuivi } from "../rdv/types";

interface DbRdv {
  id: string;
  titre: string;
  entreprise: string;
  interlocuteur: string;
  statut: string;
  preparation: string | null;
  suivi: string | null;
  passages: string | null;
  compte_rendu: string | null;
  debut: number | null;
  fin: number | null;
  created_at: number;
  updated_at: number;
}

const lireJson = <T>(brut: string | null, defaut: T): T => {
  if (!brut) return defaut;
  try {
    return JSON.parse(brut) as T;
  } catch {
    return defaut;
  }
};

function depuisDb(r: DbRdv): RendezVous {
  return {
    id: r.id,
    titre: r.titre,
    entreprise: r.entreprise || "",
    interlocuteur: r.interlocuteur || "",
    statut: (r.statut as StatutRdv) || "prepare",
    preparation: lireJson<Preparation | null>(r.preparation, null),
    suivi: r.suivi ? normaliserSuivi(lireJson<Suivi | null>(r.suivi, null)) : null,
    passages: lireJson<Passage[]>(r.passages, []),
    compteRendu: lireJson<CompteRendu | null>(r.compte_rendu, null),
    debut: r.debut ?? null,
    fin: r.fin ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const nouvelIdRdv = () =>
  `rdv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/** Tous les rendez-vous, du plus recent au plus ancien. */
export async function listerRendezVous(): Promise<RendezVous[]> {
  const db = await getDatabase();
  const rows = await db.select<DbRdv[]>(
    "SELECT * FROM rendez_vous ORDER BY updated_at DESC"
  );
  return rows.map(depuisDb);
}

export async function lireRendezVous(id: string): Promise<RendezVous | null> {
  const db = await getDatabase();
  const rows = await db.select<DbRdv[]>(
    "SELECT * FROM rendez_vous WHERE id = $1",
    [id]
  );
  return rows[0] ? depuisDb(rows[0]) : null;
}

/** Cree ou remplace un rendez-vous complet. */
export async function enregistrerRendezVous(rdv: RendezVous): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `INSERT OR REPLACE INTO rendez_vous
      (id, titre, entreprise, interlocuteur, statut, preparation, suivi, passages, compte_rendu, debut, fin, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      rdv.id,
      rdv.titre,
      rdv.entreprise,
      rdv.interlocuteur,
      rdv.statut,
      rdv.preparation ? JSON.stringify(rdv.preparation) : null,
      rdv.suivi ? JSON.stringify(rdv.suivi) : null,
      JSON.stringify(rdv.passages || []),
      rdv.compteRendu ? JSON.stringify(rdv.compteRendu) : null,
      rdv.debut,
      rdv.fin,
      rdv.createdAt,
      Date.now(),
    ]
  );
}

export async function supprimerRendezVous(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM rendez_vous WHERE id = $1", [id]);
}
