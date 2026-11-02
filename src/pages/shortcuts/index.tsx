import { CursorSelection, ShortcutManager } from "./components";
import { PageLayout } from "@/layouts";

const Shortcuts = () => {
  return (
    <PageLayout
      title="Raccourcis et curseur"
      description="Les raccourcis clavier de C.A.P.R.I et la visibilité du curseur."
    >
      <div className="flex flex-col gap-6 pb-8">
        {/* Cursor Selection */}
        <CursorSelection />

        {/* Keyboard Shortcuts */}
        <ShortcutManager />
      </div>
    </PageLayout>
  );
};

export default Shortcuts;
