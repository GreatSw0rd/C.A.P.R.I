-- Rendez-vous commerciaux : preparation, suivi en direct (SPIN, qualification),
-- passages entendus et compte-rendu. Les champs structures sont stockes en JSON.
CREATE TABLE IF NOT EXISTS rendez_vous (
    id TEXT PRIMARY KEY,
    titre TEXT NOT NULL,
    entreprise TEXT NOT NULL DEFAULT '',
    interlocuteur TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT 'prepare',
    preparation TEXT,
    suivi TEXT,
    passages TEXT,
    compte_rendu TEXT,
    debut INTEGER,
    fin INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rendez_vous_updated_at ON rendez_vous(updated_at DESC);
