import { lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { lireActivite } from "@/lib/capri-activite";
import { useEffetsVisuels } from "@/hooks/useEffets";
import { Phosphore } from "./Phosphore";

const Orb = lazy(() => import("@/components/reactbits/Orb"));

// Orbe de C.A.P.R.I : elle s'anime quand quelqu'un parle, s'agite pendant la reflexion et
// pulse a chaque morceau de reponse. Effets "complet" : iris phosphore (shader couteux) ;
// "leger" : halo React Bits Orb, plus economique ; "aucun" : disque fixe.
export const OrbeCapri = ({
  className,
  interactive = true,
}: {
  className?: string;
  /** Reagit aussi a la souris (survol, clic). */
  interactive?: boolean;
}) => {
  const [niveau] = useEffetsVisuels();

  if (niveau === "aucun") {
    return (
      <div className={cn("relative", className)}>
        <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#e9e0ff_0%,#9c7bff_30%,#5b2be0_65%,#1e0b5c_100%)] shadow-[0_0_24px_-2px_rgba(124,77,255,0.7)]" />
      </div>
    );
  }

  if (niveau === "complet") {
    return (
      <div className={cn("relative", className)}>
        <Phosphore activity={lireActivite} suivreSouris={interactive} />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Suspense fallback={null}>
        <Orb
          colors={["#9c43fe", "#4cc2e9", "#2a0f8f"]}
          backgroundColor="#000000"
          glow={1.15}
          wobble={1}
          speed={0.7}
          activity={lireActivite}
          followCursor={interactive}
          clickPulse={interactive}
          rotateOnHover={interactive}
          hoverIntensity={interactive ? 1 : 0}
          dpr={1.5}
        />
      </Suspense>
    </div>
  );
};
