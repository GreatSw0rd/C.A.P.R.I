import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AppIconToggleProps {
  className?: string;
}

export const AppIconToggle = ({ className }: AppIconToggleProps) => {
  const { customizable, toggleAppIconVisibility } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAppIconVisibility(checked);
  };

  return (
    <div id="app-icon" className={`space-y-2 ${className}`}>
      <Header
        title="Icône dans la barre des tâches"
        description="Affiche ou masque l'icône du dock / de la barre des tâches. Masquer l'icône fait partie du mode furtif : déverrouillez-le d'abord."
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {!customizable.appIcon.isVisible
                ? "Afficher l'icône"
                : "Masquer l'icône"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {`Rendre l'icône ${
                !customizable.appIcon.isVisible ? "visible" : "masquée"
              }`}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.appIcon.isVisible}
          onCheckedChange={handleSwitchChange}
          aria-label="Icône dans la barre des tâches"
        />
      </div>
    </div>
  );
};
