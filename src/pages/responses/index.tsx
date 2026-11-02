import {
  ResponseLength,
  LanguageSelector,
  AutoScrollToggle,
} from "./components";
import { PageLayout } from "@/layouts";
import { useApp } from "@/contexts";

const Responses = () => {
  const { hasActiveLicense } = useApp();

  return (
    <PageLayout
      title="Réponses"
      description="La longueur, la langue et le défilement des réponses de l'IA."
    >
      {!hasActiveLicense && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-[10px] lg:text-sm text-foreground font-medium mb-2">
            🔒 Fonctions avec licence
          </p>
          <p className="text-[10px] lg:text-sm text-muted-foreground">
            La longueur, la langue et le défilement des réponses demandent une
            licence active.
          </p>
        </div>
      )}

      {/* Response Length */}
      <ResponseLength />

      {/* Language Selector */}
      <LanguageSelector />

      {/* Auto-Scroll Toggle */}
      <AutoScrollToggle />
    </PageLayout>
  );
};

export default Responses;
