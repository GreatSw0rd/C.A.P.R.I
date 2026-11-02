import { XIcon } from "lucide-react";
import { UseCompletionReturn } from "@/types";

// Vignettes des captures et images jointes au prochain message.
export const AttachmentStrip = ({
  attachedFiles,
  removeFile,
}: Pick<UseCompletionReturn, "attachedFiles" | "removeFile">) => {
  if (attachedFiles.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {attachedFiles.map((f) => (
        <div
          key={f.id}
          className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border ov-divider"
        >
          <img
            src={`data:${f.type};base64,${f.base64}`}
            alt={f.name}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            title="Retirer"
            onClick={() => removeFile(f.id)}
            className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
