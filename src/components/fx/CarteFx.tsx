import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { useEffetsVisuels, useThemeSombre } from "@/hooks/useEffets";
import { cn } from "@/lib/utils";

// Carte de la charte : halo qui suit la souris (React Bits SpotlightCard) en mode complet,
// carte simple sinon. Le fond reste legerement transparent pour laisser voir le fond anime.
export const CarteFx = ({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const [niveau] = useEffetsVisuels();
  const sombre = useThemeSombre();
  const base = cn(
    "rounded-2xl text-card-foreground",
    onClick && "cursor-pointer",
    className
  );

  if (niveau !== "complet") {
    return (
      <div
        onClick={onClick}
        className={cn(base, "border border-border souffleur-carte transition-colors hover:border-primary/40")}
      >
        {children}
      </div>
    );
  }

  return (
    <SpotlightCard
      onClick={onClick}
      theme={sombre ? "dark" : "light"}
      spotlightColor={sombre ? "rgba(182, 156, 255, 0.22)" : "rgba(124, 77, 255, 0.14)"}
      spotlightSize={260}
      className={base}
      style={
        {
          "--spotlight-card-surface":
            "color-mix(in oklab, var(--card) 78%, transparent)",
        } as React.CSSProperties
      }
    >
      {children}
    </SpotlightCard>
  );
};
