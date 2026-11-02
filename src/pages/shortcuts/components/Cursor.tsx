import {
  Header,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { useApp } from "@/contexts";
import { useFurtif } from "@/hooks";
import { getPlatform } from "@/lib";
import { CursorType } from "@/lib/storage";
import { MousePointer, MousePointer2, Pointer, TextCursor } from "lucide-react";

interface CursorSelectionProps {
  className?: string;
}

export const CursorSelection = ({ className }: CursorSelectionProps) => {
  const { customizable, setCursorType } = useApp();
  const { statut } = useFurtif();
  const platform = getPlatform();

  // Masquer le curseur fait partie du mode furtif : disponible seulement une fois celui-ci deverrouille.
  const curseurInvisibleBloque = platform === "linux" || !statut.deverrouille;

  return (
    <div id="cursor" className={`space-y-2 ${className}`}>
      <Header
        title="Curseur"
        description="Visibilité du curseur de C.A.P.R.I"
        isMainTitle
        rightSlot={
          <Select
            value={customizable.cursor.type}
            onValueChange={(value) => setCursorType(value as CursorType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un type de curseur" />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="invisible" disabled={curseurInvisibleBloque}>
                Invisible (<MousePointer2 className="size-3 px-0" />){" "}
                {platform === "linux" ? (
                  <span className="text-xs text-muted-foreground">
                    Non pris en charge sur Linux
                  </span>
                ) : (
                  !statut.deverrouille && (
                    <span className="text-xs text-muted-foreground">
                      Déverrouillez le mode furtif
                    </span>
                  )
                )}
              </SelectItem>
              <SelectItem value="default">
                Default (<MousePointer className="size-3" />)
              </SelectItem>
              <SelectItem value="auto">
                Auto (
                <MousePointer className="size-3" />/
                <TextCursor className="size-3" /> /
                <Pointer className="size-3" />)
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
};
