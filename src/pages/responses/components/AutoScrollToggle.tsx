import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";
import { useState, useEffect } from "react";
import { getResponseSettings, updateAutoScroll } from "@/lib";

export const AutoScrollToggle = () => {
  const { hasActiveLicense } = useApp();
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    const settings = getResponseSettings();
    setAutoScroll(settings.autoScroll);
  }, []);

  const handleSwitchChange = (checked: boolean) => {
    if (!hasActiveLicense) {
      return;
    }
    setAutoScroll(checked);
    updateAutoScroll(checked);
  };

  return (
    <div className="space-y-4">
      <Header
        title="Défilement automatique"
        description="Suivre la réponse pendant qu'elle s'écrit."
        isMainTitle
      />

      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {autoScroll ? "Auto-Scroll Enabled" : "Auto-Scroll Disabled"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {autoScroll
                ? "La réponse défile toute seule pendant qu'elle s'écrit"
                : "La réponse reste là où vous êtes"}
            </p>
          </div>
        </div>
        <Switch
          checked={autoScroll}
          onCheckedChange={handleSwitchChange}
          disabled={!hasActiveLicense}
          title="Défilement automatique"
          aria-label="Défilement automatique"
        />
      </div>
    </div>
  );
};
