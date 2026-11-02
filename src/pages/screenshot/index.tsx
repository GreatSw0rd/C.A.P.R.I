import { ScreenshotConfigs } from "./components";
import { useSettings } from "@/hooks";
import { PageLayout } from "@/layouts";

const Settings = () => {
  const settings = useSettings();
  return (
    <PageLayout
      title="Captures d'écran"
      description="Comment l'outil capture votre écran et ce qu'il en fait."
    >
      {/* Screenshot Configs */}
      <ScreenshotConfigs {...settings} />
    </PageLayout>
  );
};

export default Settings;
