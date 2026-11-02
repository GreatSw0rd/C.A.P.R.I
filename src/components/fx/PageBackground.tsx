import { lazy, Suspense, memo } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffetsVisuels, useThemeSombre } from "@/hooks/useEffets";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Particles } from "@/components/ui/particles";
import { Ripple } from "@/components/ui/ripple";

// Fonds WebGL (React Bits) charges a la demande : un seul est actif a la fois.
const DarkVeil = lazy(() => import("@/components/reactbits/DarkVeil"));
const Threads = lazy(() => import("@/components/reactbits/Threads"));
const Aurora = lazy(() => import("@/components/reactbits/Aurora"));
const LightRays = lazy(() => import("@/components/reactbits/LightRays"));

// Couleurs de la charte (violet d'ambiance, vert d'accent).
export const FX = {
  violet: "#7c4dff",
  violetClair: "#b69cff",
  violetProfond: "#3b1d8f",
  vert: "#c4eaaa",
};

type Fond =
  | "voile"
  | "grille"
  | "scintille"
  | "fils"
  | "aurore"
  | "particules"
  | "ondes"
  | "rayons"
  | "points";

function fondPour(chemin: string): Fond {
  if (chemin.startsWith("/rendez-vous")) return "voile";
  if (chemin.startsWith("/chats")) return "grille";
  if (chemin.startsWith("/knowledge")) return "scintille";
  if (chemin.startsWith("/system-prompts")) return "fils";
  if (chemin.startsWith("/responses")) return "aurore";
  if (chemin.startsWith("/dev-space")) return "particules";
  if (chemin.startsWith("/audio")) return "ondes";
  if (chemin.startsWith("/screenshot")) return "rayons";
  return "points";
}

// Fond anime du panneau principal, choisi selon la page et le niveau d'effets.
export const PageBackground = memo(function PageBackground() {
  const { pathname } = useLocation();
  const [niveau] = useEffetsVisuels();
  const sombre = useThemeSombre();
  const fond = fondPour(pathname);

  if (niveau === "aucun") return null;

  // Mode leger : motif de points en CSS pur, aucun calcul image par image.
  if (niveau === "leger") {
    return (
      <Calque>
        <Points />
      </Calque>
    );
  }

  let contenu: React.ReactNode = null;
  switch (fond) {
    case "voile":
      contenu = (
        <div className="absolute inset-0 opacity-70 dark:opacity-90">
          <DarkVeil
            color={FX.violet}
            speed={0.35}
            glow={0.35}
            grain={0.02}
            quality={0.45}
            lightMode={!sombre}
            mouseInteraction={false}
            fade={0.4}
            dpr={1}
          />
        </div>
      );
      break;
    case "fils":
      contenu = (
        <div className="absolute inset-x-0 bottom-0 h-[70%] opacity-60">
          <Threads
            color={sombre ? FX.violetClair : FX.violet}
            accentColor={FX.vert}
            amplitude={0.8}
            distance={0.2}
            lineCount={18}
            speed={0.6}
            enableMouseInteraction={false}
          />
        </div>
      );
      break;
    case "aurore":
      contenu = (
        <div className="absolute inset-x-0 top-0 h-[45%] opacity-45 [mask-image:linear-gradient(to_bottom,white,transparent)]">
          <Aurora
            colorStops={[FX.violetProfond, FX.violet, FX.violetClair]}
            amplitude={0.7}
            blend={0.6}
            speed={0.5}
            lightMode={!sombre}
            dpr={1}
          />
        </div>
      );
      break;
    case "rayons":
      contenu = (
        <div className="absolute inset-0 opacity-70">
          <LightRays
            raysOrigin="top-center"
            raysColor={sombre ? FX.violetClair : FX.violet}
            raysSpeed={0.8}
            lightSpread={0.9}
            rayLength={1.4}
            followMouse={false}
            lightMode={!sombre}
            maxDevicePixelRatio={1}
          />
        </div>
      );
      break;
    case "grille":
      contenu = (
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.3}
          duration={4}
          repeatDelay={1.5}
          className={cn(
            "inset-x-0 inset-y-[-20%] h-[140%] skew-y-6 fill-violet-400/30 stroke-foreground/15",
            "[mask-image:radial-gradient(900px_circle_at_top_right,white,transparent)]"
          )}
        />
      );
      break;
    case "scintille":
      contenu = (
        <FlickeringGrid
          className="absolute inset-0 [mask-image:radial-gradient(700px_circle_at_top,white,transparent)]"
          squareSize={4}
          gridGap={10}
          color={sombre ? FX.violetClair : FX.violet}
          maxOpacity={0.25}
          flickerChance={0.08}
        />
      );
      break;
    case "particules":
      contenu = (
        <Particles
          className="absolute inset-0"
          quantity={70}
          ease={80}
          size={0.5}
          color={sombre ? FX.violetClair : FX.violet}
        />
      );
      break;
    case "ondes":
      contenu = (
        <div className="absolute inset-x-0 -top-48 h-[620px] [&_div]:!bg-violet-500/10 [&_div]:![border-color:rgb(182_156_255/0.5)]">
          <Ripple mainCircleSize={200} mainCircleOpacity={0.35} numCircles={6} />
        </div>
      );
      break;
    default:
      contenu = <Points />;
  }

  return (
    <Calque key={fond}>
      <Suspense fallback={null}>{contenu}</Suspense>
    </Calque>
  );
});

// Points en CSS (un seul degrade repete) : remplace un motif SVG anime point par point,
// qui faisait ramer les pages Reglages et Raccourcis.
const Points = () => (
  <div
    className="absolute inset-0 text-foreground/15 [background-image:radial-gradient(currentColor_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,white,transparent_72%)]"
  />
);

const Calque = ({ children }: { children: React.ReactNode }) => (
  <div
    aria-hidden
    className="souffleur-fond pointer-events-none absolute inset-0 overflow-hidden"
  >
    {children}
  </div>
);
