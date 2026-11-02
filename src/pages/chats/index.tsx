import { useEffect, useState } from "react";
import { Input, Card, Empty } from "@/components";
import { motion } from "motion/react";
import { CarteFx } from "@/components/fx";
import { BlurFade } from "@/components/ui/blur-fade";
import { useHistory } from "@/hooks";
import { PageLayout } from "@/layouts";
import { KnowledgeDocument, getAllKnowledge } from "@/lib";
import { cn } from "@/lib/utils";
import {
  MessageCircleIcon,
  MessageSquareIcon,
  HeadphonesIcon,
  FileTextIcon,
  ImageIcon,
  Search,
} from "lucide-react";
import moment from "moment";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChatConversation } from "@/types/completion";

type Onglet = "discussions" | "reunions" | "fichiers";

const ONGLETS: { id: Onglet; label: string; icone: React.ElementType }[] = [
  { id: "discussions", label: "Discussions", icone: MessageSquareIcon },
  { id: "reunions", label: "Réunions", icone: HeadphonesIcon },
  { id: "fichiers", label: "Fichiers", icone: FileTextIcon },
];

const estReunion = (id: string) => id.startsWith("sysaudio_conv");

// Conversations : discussions (questions posees), reunions (ecoutes) et fichiers joints.
const Conversations = () => {
  const conversations = useHistory();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const onglet: Onglet =
    (ONGLETS.find((o) => o.id === params.get("onglet"))?.id as Onglet) ??
    "discussions";
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  useEffect(() => {
    getAllKnowledge()
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }, []);

  const requete = (conversations.search || "").toLowerCase().trim();
  const correspond = (doc: ChatConversation): boolean => {
    if (requete === "") return true;
    if (doc.title.toLowerCase().includes(requete)) return true;
    return doc.messages.some((m) => m.content.toLowerCase().includes(requete));
  };

  const parType = conversations.conversations.filter((c) =>
    onglet === "reunions" ? estReunion(c.id) : !estReunion(c.id)
  );
  const visibles = parType.filter(correspond);

  // Regroupement par jour, du plus recent au plus ancien.
  const groupes = visibles.reduce((acc, doc) => {
    const cle = moment(doc.updatedAt).format("YYYY-MM-DD");
    (acc[cle] ??= []).push(doc);
    return acc;
  }, {} as Record<string, ChatConversation[]>);
  const jours = Object.keys(groupes).sort((a, b) => moment(b).diff(moment(a)));

  // Fichiers joints aux messages (captures d'ecran, images).
  const pieces = conversations.conversations.flatMap((c) =>
    c.messages.flatMap((m) =>
      (m.attachedFiles ?? []).map((f) => ({ ...f, conversation: c, date: m.timestamp }))
    )
  );
  const piecesVisibles = pieces.filter(
    (p) => requete === "" || p.name.toLowerCase().includes(requete)
  );
  const documentsVisibles = documents.filter(
    (d) => requete === "" || d.name.toLowerCase().includes(requete)
  );

  const compte = (o: Onglet) =>
    o === "fichiers"
      ? pieces.length + documents.length
      : conversations.conversations.filter((c) =>
          o === "reunions" ? estReunion(c.id) : !estReunion(c.id)
        ).length;

  return (
    <PageLayout
      sectionCards={false}
      title="Conversations"
      description="Vos discussions, vos réunions écoutées et les fichiers utilisés. La recherche porte sur les titres et le contenu."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setParams({ onglet: o.id })}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                onglet === o.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {onglet === o.id && (
                <motion.span
                  layoutId="onglet-conversations"
                  className="absolute inset-0 rounded-lg border border-white/5 bg-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <o.icone className="relative size-3.5" />
              <span className="relative">{o.label}</span>
              <span
                className={cn(
                  "relative rounded-md px-1.5 text-[10px]",
                  onglet === o.id
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary"
                )}
              >
                {compte(o.id)}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={conversations.search}
            onChange={(e) => conversations.setSearch(e.target.value)}
          />
        </div>
      </div>

      {onglet === "fichiers" ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Images et captures jointes ({piecesVisibles.length})
            </p>
            {piecesVisibles.length === 0 ? (
              <Card className="p-6 text-center text-xs text-muted-foreground shadow-none">
                Aucune image jointe pour l'instant.
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {piecesVisibles.map((p) => (
                  <Card
                    key={p.id}
                    onClick={() => navigate(`/chats/view/${p.conversation.id}`)}
                    className="cursor-pointer gap-0 overflow-hidden p-0 shadow-none hover:border-primary/40"
                  >
                    <div className="flex aspect-video items-center justify-center bg-secondary">
                      {p.base64 ? (
                        <img
                          src={`data:${p.type};base64,${p.base64}`}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs">{p.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {p.conversation.title}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Documents de connaissances ({documentsVisibles.length})
              </p>
              <button
                type="button"
                onClick={() => navigate("/knowledge")}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Gérer
              </button>
            </div>
            {documentsVisibles.length === 0 ? (
              <Card className="p-6 text-center text-xs text-muted-foreground shadow-none">
                Aucun document. Ajoutez votre offre, vos objections ou vos
                références dans Connaissances.
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {documentsVisibles.map((d) => (
                  <Card
                    key={d.id}
                    onClick={() => navigate("/knowledge")}
                    className="cursor-pointer flex-row items-center gap-3 p-3 shadow-none hover:border-primary/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{d.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {d.charCount.toLocaleString("fr-FR")} caractères ·{" "}
                        {d.enabled ? "actif" : "désactivé"}
                      </span>
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : parType.length === 0 ? (
        <Empty
          isLoading={conversations.isLoading}
          icon={onglet === "reunions" ? HeadphonesIcon : MessageCircleIcon}
          title={onglet === "reunions" ? "Aucune réunion" : "Aucune discussion"}
          description={
            onglet === "reunions"
              ? "Lancez une écoute depuis l'overlay pendant un rendez-vous."
              : "Posez une question depuis l'overlay pour commencer."
          }
        />
      ) : (
        <div className="flex flex-col gap-6 pb-8">
          {jours.map((cle) => (
            <div key={cle} className="flex flex-col gap-2">
              <p className="select-none text-xs font-medium capitalize text-muted-foreground">
                {moment(cle).format("dddd D MMMM")}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {groupes[cle].map((doc, i) => {
                  const Icone = estReunion(doc.id) ? HeadphonesIcon : MessageSquareIcon;
                  return (
                    <BlurFade key={doc.id} delay={0.03 * i} blur="3px">
                      <CarteFx
                        className="group flex items-center gap-3 rounded-xl p-3 select-none"
                        onClick={() => navigate(`/chats/view/${doc.id}`)}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/80 transition-colors group-hover:bg-primary/15">
                          <Icone className="size-4 text-muted-foreground group-hover:text-primary" />
                        </span>
                        <p className="min-w-0 flex-1 truncate text-sm">{doc.title}</p>
                        <span className="shrink-0 rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {doc.messages.length} messages
                        </span>
                        <span className="w-12 shrink-0 text-right text-[11px] text-muted-foreground">
                          {moment(doc.updatedAt).format("HH:mm")}
                        </span>
                      </CarteFx>
                    </BlurFade>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default Conversations;
