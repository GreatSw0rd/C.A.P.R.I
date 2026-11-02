import { getDatabase } from "./config";

// Document de connaissances injecte dans le prompt (offre, objections, references).
export interface KnowledgeDocument {
  id: string;
  name: string;
  content: string;
  charCount: number;
  enabled: boolean;
  createdAt: number;
}

interface DbKnowledge {
  id: string;
  name: string;
  content: string;
  char_count: number;
  enabled: number;
  created_at: number;
}

function fromDb(row: DbKnowledge): KnowledgeDocument {
  return {
    id: row.id,
    name: row.name,
    content: row.content,
    charCount: row.char_count,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
  };
}

/** Liste tous les documents (contenu inclus), du plus recent au plus ancien. */
export async function getAllKnowledge(): Promise<KnowledgeDocument[]> {
  const db = await getDatabase();
  const rows = await db.select<DbKnowledge[]>(
    "SELECT * FROM knowledge_documents ORDER BY created_at DESC"
  );
  return rows.map(fromDb);
}

/** Ajoute un document. */
export async function addKnowledge(
  name: string,
  content: string
): Promise<KnowledgeDocument> {
  const db = await getDatabase();
  const id = `kn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const doc: KnowledgeDocument = {
    id,
    name: name.trim() || "Document",
    content,
    charCount: content.length,
    enabled: true,
    createdAt: Date.now(),
  };
  await db.execute(
    "INSERT INTO knowledge_documents (id, name, content, char_count, enabled, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [doc.id, doc.name, doc.content, doc.charCount, 1, doc.createdAt]
  );
  return doc;
}

/** Active ou desactive un document (sans le supprimer). */
export async function setKnowledgeEnabled(
  id: string,
  enabled: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE knowledge_documents SET enabled = $1 WHERE id = $2",
    [enabled ? 1 : 0, id]
  );
}

/** Supprime un document. */
export async function deleteKnowledge(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM knowledge_documents WHERE id = $1", [id]);
}

/**
 * Renvoie le texte combine des documents actifs, pret a injecter dans la consigne systeme.
 * Vide si aucun document actif.
 */
export async function getKnowledgeContext(): Promise<string> {
  const db = await getDatabase();
  const rows = await db.select<DbKnowledge[]>(
    "SELECT name, content FROM knowledge_documents WHERE enabled = 1 ORDER BY created_at ASC"
  );
  if (rows.length === 0) return "";
  const blocs = rows.map(
    (r) => `--- ${r.name} ---\n${r.content.trim()}`
  );
  return blocs.join("\n\n");
}

/**
 * Ajoute les connaissances actives en tete de la consigne systeme. Renvoie la consigne inchangee
 * s'il n'y a aucune connaissance active. En cas d'erreur de lecture, on n'empeche jamais la reponse.
 */
export async function withKnowledge(
  base?: string
): Promise<string | undefined> {
  try {
    const k = await getKnowledgeContext();
    if (!k) return base;
    const entete =
      "=== CONNAISSANCES (référence fournie par l'utilisateur ; appuie-toi dessus en priorité, n'invente rien au-delà) ===";
    return `${base ? base + "\n\n" : ""}${entete}\n${k}`;
  } catch {
    return base;
  }
}
