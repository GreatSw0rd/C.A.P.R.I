import {
  Theme,
  AlwaysOnTopToggle,
  AppIconToggle,
  AutostartToggle,
  ModeFurtif,
  EffetsVisuels,
} from "./components";
import { PageLayout } from "@/layouts";

const Settings = () => {
  return (
    <PageLayout title="Réglages" description="Gérez les réglages de C.A.P.R.I">
      {/* Thème */}
      <Theme />

      {/* Effets visuels */}
      <EffetsVisuels />

      {/* Démarrage automatique */}
      <AutostartToggle />

      {/* Icône dans la barre des tâches */}
      <AppIconToggle />

      {/* Toujours au premier plan */}
      <AlwaysOnTopToggle />

      {/* Mode furtif (verrouillé) */}
      <ModeFurtif />

      {/* Mention de licence (obligatoire : C.A.P.R.I est dérivé de Pluely, GPL-3.0) */}
      <p className="pt-2 text-[11px] text-muted-foreground select-text">
        C.A.P.R.I est dérivé de Pluely 0.1.9 (Srikanth Nani), distribué sous licence
        GPL-3.0. Ce logiciel est fourni sans aucune garantie.
      </p>
    </PageLayout>
  );
};

export default Settings;
