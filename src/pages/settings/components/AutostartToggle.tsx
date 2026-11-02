import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AutostartToggleProps {
  className?: string;
}

export const AutostartToggle = ({ className }: AutostartToggleProps) => {
  const { customizable, toggleAutostart } = useApp();

  const isEnabled = customizable?.autostart?.isEnabled ?? true;

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAutostart(checked);
  };

  return (
    <div id="autostart" className={`space-y-2 ${className}`}>
      <Header
        title="Lancer au démarrage"
        description="Ouvre C.A.P.R.I automatiquement quand l'ordinateur démarre."
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">Open on Start</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {isEnabled
                ? "C.A.P.R.I se lance au démarrage de l'ordinateur"
                : "C.A.P.R.I ne se lance pas automatiquement"}
            </p>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleSwitchChange}
          aria-label="Lancer au démarrage"
        />
      </div>
    </div>
  );
};
