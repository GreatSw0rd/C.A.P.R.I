import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Header,
  Switch,
  Textarea,
  Input,
  Empty,
} from "@/components";
import { PageLayout } from "@/layouts";
import {
  KnowledgeDocument,
  getAllKnowledge,
  addKnowledge,
  setKnowledgeEnabled,
  deleteKnowledge,
  extractTextFromFile,
  choisirFichiers,
  useDepotFichiers,
  EXTENSIONS_DOCUMENTS,
} from "@/lib";
import {
  UploadIcon,
  Trash2,
  FileTextIcon,
  PlusIcon,
  Loader2,
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import { CarteFx, FX } from "@/components/fx";
import { cn } from "@/lib/utils";

// Seuil indicatif au-dela duquel la base devient trop grosse pour etre injectee entierement.
const SEUIL_CARACTERES = 200_000;

const Knowledge = () => {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nomTexte, setNomTexte] = useState("");
  const [texteColle, setTexteColle] = useState("");

  const recharger = useCallback(async () => {
    try {
      setDocs(await getAllKnowledge());
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const totalActif = docs
    .filter((d) => d.enabled)
    .reduce((acc, d) => acc + d.charCount, 0);

  const importerFichiers = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    setErreur(null);
    const echecs: string[] = [];
    try {
      for (const file of files) {
        try {
          // Limite de temps : un fichier problematique ne doit jamais bloquer la page.
          const texte = await Promise.race([
            extractTextFromFile(file),
            new Promise<string>((_, reject) =>
              setTimeout(
                () => reject(new Error("extraction trop longue")),
                90_000
              )
            ),
          ]);
          if (texte.trim()) {
            await addKnowledge(file.name, texte);
          } else {
            echecs.push(`« ${file.name} » : aucun texte trouvé (PDF scanné ?)`);
          }
        } catch (e) {
          echecs.push(
            `« ${file.name} » : ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }
      await recharger();
    } finally {
      setBusy(false);
      if (echecs.length) setErreur(echecs.join(" · "));
    }
  };

  const parcourir = async () => {
    try {
      const fichiers = await choisirFichiers({
        extensions: EXTENSIONS_DOCUMENTS,
        libelle: "Documents",
      });
      await importerFichiers(fichiers);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  // Glisser-deposer sur la fenetre (gere par Tauri).
  const survol = useDepotFichiers(EXTENSIONS_DOCUMENTS, importerFichiers, !busy);

  const ajouterTexte = async () => {
    if (!texteColle.trim()) return;
    setBusy(true);
    setErreur(null);
    try {
      await addKnowledge(nomTexte.trim() || "Texte collé", texteColle.trim());
      setNomTexte("");
      setTexteColle("");
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const basculer = async (doc: KnowledgeDocument) => {
    await setKnowledgeEnabled(doc.id, !doc.enabled);
    await recharger();
  };

  const supprimer = async (id: string) => {
    await deleteKnowledge(id);
    await recharger();
  };

  return (
    <PageLayout
      title="Connaissances"
      description="Vos documents (offre, objections, références) injectés dans les réponses de l'IA. Extraction locale, rien n'est envoyé ailleurs."
    >
      {/* Import */}
      <div className="space-y-3">
        <Header
          title="Ajouter des documents"
          description="PDF, Word (.docx) ou texte. Le texte est extrait sur votre machine."
        />
        {/* Zone de depot : cliquer ou glisser des fichiers */}
        <button
          type="button"
          disabled={busy}
          onClick={parcourir}
          className={cn(
            "group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed px-4 py-7 text-center transition-all duration-200",
            survol
              ? "border-primary/70 bg-primary/10"
              : "border-border hover:border-primary/40 hover:bg-accent/40",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 transition-transform duration-200 group-hover:-translate-y-0.5">
            {busy ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <UploadIcon className="size-5 text-primary" />
            )}
          </span>
          <span className="text-sm font-medium">
            {busy
              ? "Extraction en cours…"
              : "Glissez vos fichiers ici ou cliquez pour importer"}
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, Word (.docx), texte, Markdown, CSV
          </span>
          {busy && (
            <BorderBeam
              size={90}
              duration={2.5}
              colorFrom={FX.vert}
              colorTo={FX.violet}
            />
          )}
        </button>

        <div className="space-y-2 pt-2">
          <Input
            placeholder="Nom (optionnel), ex. Objections fréquentes"
            value={nomTexte}
            onChange={(e) => setNomTexte(e.target.value)}
          />
          <Textarea
            placeholder="…ou collez directement du texte ici (offre, argumentaire, FAQ)."
            className="min-h-[100px]"
            value={texteColle}
            onChange={(e) => setTexteColle(e.target.value)}
          />
          <Button
            size="sm"
            disabled={busy || !texteColle.trim()}
            onClick={ajouterTexte}
          >
            <PlusIcon className="h-4 w-4" /> Ajouter le texte
          </Button>
        </div>

        {erreur && <p className="text-xs text-destructive">{erreur}</p>}
      </div>

      {/* Etat */}
      <div className="ds-bare flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          {docs.filter((d) => d.enabled).length} document(s) actif(s) ·{" "}
          {totalActif.toLocaleString("fr-FR")} caractères injectés
        </span>
        {totalActif > SEUIL_CARACTERES && (
          <span className="text-amber-600">
            Base volumineuse : désactivez des documents ou gardez l'essentiel.
          </span>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-sm text-muted-foreground px-1">Chargement…</p>
      ) : docs.length === 0 ? (
        <Empty
          isLoading={false}
          icon={FileTextIcon}
          title="Aucune connaissance"
          description="Importez un document ou collez du texte pour commencer."
        />
      ) : (
        <div className="ds-bare grid gap-2">
          {docs.map((doc, i) => (
            <BlurFade key={doc.id} delay={0.03 * i} blur="3px">
              <CarteFx className="flex items-center justify-between gap-3 rounded-xl p-3">
                <div className="min-w-0 flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/80">
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.charCount.toLocaleString("fr-FR")} caractères
                      {doc.enabled ? "" : " · désactivé"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={doc.enabled}
                    onCheckedChange={() => basculer(doc)}
                    aria-label="Activer ce document"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => supprimer(doc.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CarteFx>
            </BlurFade>
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default Knowledge;
