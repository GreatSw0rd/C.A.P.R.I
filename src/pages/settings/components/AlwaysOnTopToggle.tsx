import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AlwaysOnTopToggleProps {
  className?: string;
}

export const AlwaysOnTopToggle = ({ className }: AlwaysOnTopToggleProps) => {
  const { customizable, toggleAlwaysOnTop } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAlwaysOnTop(checked);
  };

  return (
    <div id="always-on-top" className={`space-y-2 ${className}`}>
      <Header
        title="Toujours au premier plan"
        description="L'overlay reste au-dessus de toutes les autres fenêtres."
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {customizable.alwaysOnTop.isEnabled
                ? "Disable Always On Top"
                : "Enable Always On Top"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {customizable.alwaysOnTop.isEnabled
                ? "L'overlay reste au-dessus des autres fenêtres (par défaut)"
                : "L'overlay se comporte comme une fenêtre normale"}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.alwaysOnTop.isEnabled}
          onCheckedChange={handleSwitchChange}
          title="Toujours au premier plan"
          aria-label="Toujours au premier plan"
        />
      </div>
    </div>
  );
};
