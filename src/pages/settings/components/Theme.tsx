import { motion } from "motion/react";
import { useTheme } from "@/contexts";
import { Header, Slider } from "@/components";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useThemeSombre } from "@/hooks/useEffets";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "light", label: "Clair", icone: SunIcon },
  { id: "dark", label: "Sombre", icone: MoonIcon },
  { id: "system", label: "Système", icone: MonitorIcon },
] as const;

// Apparence : theme (avec transition circulaire) et transparence de l'overlay.
export const Theme = () => {
  const { theme, transparency, setTheme, onSetTransparency } = useTheme();
  const sombre = useThemeSombre();

  return (
    <div id="theme" className="relative space-y-4">
      <Header
        title="Apparence"
        description="Thème du tableau de bord et transparence de l'overlay."
        isMainTitle
      />

      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/40 p-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                theme === t.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {theme === t.id && (
                <motion.span
                  layoutId="choix-theme"
                  className="absolute inset-0 rounded-lg bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <t.icone className="relative size-3.5" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <AnimatedThemeToggler
          theme={sombre ? "dark" : "light"}
          onThemeChange={(t) => setTheme(t)}
          duration={500}
          title="Basculer clair / sombre"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-background/40 transition-colors hover:bg-accent [&_svg]:size-4"
        />
      </div>

      <div className="space-y-3">
        <Header
          title="Transparence de l'overlay"
          description="Plus la valeur est haute, plus on voit à travers la fenêtre de l'overlay."
        />
        <div className="flex items-center gap-4">
          <Slider
            value={[transparency]}
            onValueChange={(value: number[]) => onSetTransparency(value[0])}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {transparency}%
          </span>
        </div>
      </div>
    </div>
  );
};
