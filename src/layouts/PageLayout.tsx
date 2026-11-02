import { Header, ScrollArea } from "@/components";

export const PageLayout = ({
  children,
  title,
  description,
  rightSlot,
  allowBackButton = false,
  isMainTitle = true,
  sectionCards = true,
  showHeader = true,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  rightSlot?: React.ReactNode;
  allowBackButton?: boolean;
  isMainTitle?: boolean;
  // Chaque bloc enfant est affiche dans une carte (pages de reglages).
  sectionCards?: boolean;
  // Masque l'en-tete (titre et description) quand la page a son propre bandeau.
  showHeader?: boolean;
}) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showHeader && (
        <header className="pt-8">
          <Header
            isMainTitle={isMainTitle}
            showBorder={true}
            title={title}
            description={description}
            rightSlot={rightSlot}
            allowBackButton={allowBackButton}
            animateTitle
          />
        </header>
      )}

      <ScrollArea className="min-h-0 flex-1 -mr-6 pr-6">
        <div
          className={`flex flex-col gap-4 pb-12 pt-4 px-1 ${
            sectionCards ? "souffleur-sections" : ""
          }`}
        >
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};
