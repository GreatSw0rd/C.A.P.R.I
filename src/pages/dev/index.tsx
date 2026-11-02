import { AIProviders, STTProviders } from "./components";
import { useSettings } from "@/hooks";
import { PageLayout } from "@/layouts";

const DevSpace = () => {
  const settings = useSettings();

  return (
    <PageLayout
      title="Fournisseurs d'IA"
      description="Le LLM qui répond (le cerveau) et le service qui transcrit la voix (l’oreille)."
    >
      {/* Provider Selection */}
      <AIProviders {...settings} />

      {/* STT Providers */}
      <STTProviders {...settings} />
    </PageLayout>
  );
};

export default DevSpace;
