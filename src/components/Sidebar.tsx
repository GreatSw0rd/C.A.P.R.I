import { HeadphonesIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useMenuItems } from "@/hooks";
import { useEffetsVisuels } from "@/hooks/useEffets";
import { ouvrirOverlay } from "@/lib";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BorderBeam } from "@/components/ui/border-beam";
import { FX } from "@/components/fx";
import { OeilCapriIcon } from "@/components/Icons";

// Barre laterale du tableau de bord : logo, bouton principal, menu groupe, carte reunion et sortie.
export const Sidebar = () => {
  const { groups, footerItems } = useMenuItems();
  const [niveau] = useEffetsVisuels();

  const navigate = useNavigate();
  const activeRoute = useLocation().pathname;
  const estActif = (href: string) =>
    activeRoute === href || activeRoute.startsWith(href + "/");

  return (
    <aside className="flex w-60 shrink-0 flex-col select-none">
      {/* Logo */}
      <div
        onClick={() => navigate("/rendez-vous")}
        className="flex items-center gap-2.5 px-5 pt-12 pb-4 cursor-pointer"
      >
        <OeilCapriIcon className="size-9 shrink-0 drop-shadow-[0_0_10px_rgba(124,77,255,0.55)]" />
        <span className="text-[15px] font-semibold text-foreground">C.A.P.R.I</span>
      </div>

      {/* Bouton principal */}
      <div className="px-3 pb-4">
        <ShimmerButton
          onClick={() => ouvrirOverlay()}
          background="linear-gradient(135deg, rgba(124,77,255,0.55), rgba(59,29,143,0.55))"
          shimmerColor={FX.vert}
          shimmerDuration={niveau === "complet" ? "3.5s" : "0s"}
          borderRadius="12px"
          className="w-full justify-start gap-2 px-3 py-2 text-[13px] font-medium"
        >
          <PlusIcon className="size-4" />
          Nouvelle question
        </ShimmerButton>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        {groups.map((groupe, gi) => (
          <div key={`${groupe.title}-${gi}`} className="space-y-0.5">
            {groupe.title && (
              <p className="px-3 pb-1 pt-1 text-[11px] font-medium text-muted-foreground/80">
                {groupe.title}
              </p>
            )}
            {groupe.items.map((item) => {
              const actif = estActif(item.href);
              return (
                <button
                  onClick={() => navigate(item.href)}
                  key={item.href}
                  className={cn(
                    "relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors duration-200",
                    actif
                      ? "text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {actif && (
                    <motion.span
                      layoutId="menu-actif"
                      className="absolute inset-0 rounded-lg border border-white/5 bg-sidebar-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <div className="relative flex items-center gap-3">
                    <item.icon className="size-4" />
                    {item.label}
                  </div>
                  {item.count ? (
                    <span className="relative flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1 text-[11px] font-semibold text-muted-foreground">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Carte "mode reunion" (masquee si la fenetre est peu haute) */}
      <div className="px-3 pb-3 [@media(max-height:860px)]:hidden">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/70 p-3 text-center">
          <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-primary/15">
            <HeadphonesIcon className="size-4 text-primary" />
          </div>
          <p className="text-[13px] font-semibold">Mode réunion</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            C.A.P.R.I écoute votre interlocuteur et vous propose quoi répondre.
          </p>
          <button
            type="button"
            onClick={() => ouvrirOverlay("ecouter")}
            className="mt-3 w-full rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            Lancer l'écoute
          </button>
          {niveau === "complet" && (
            <BorderBeam
              size={70}
              duration={7}
              colorFrom={FX.vert}
              colorTo={FX.violet}
            />
          )}
        </div>
      </div>

      {/* Pied : sortie */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <div className="flex-1" />
        {footerItems.map((item, index) => (
          <a
            href={item.href}
            onClick={item.action}
            target="_blank"
            rel="noopener noreferrer"
            key={`${item.label}-${index}`}
            title={item.label}
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <item.icon className="size-4" />
            Quitter
          </a>
        ))}
      </div>
    </aside>
  );
};
