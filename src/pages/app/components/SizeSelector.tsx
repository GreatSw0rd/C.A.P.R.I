import { useState } from "react";
import { useWindowResize } from "@/hooks";
import {
  OVERLAY_SIZES,
  OverlaySize,
  getOverlaySize,
  setOverlaySizeStored,
} from "@/lib";
import { raccourci } from "./overlay/raccourcis";

// Pied de l'overlay : taille de la fenetre (S/M/L/XL/Full) et rappel du raccourci pour masquer.
export const SizeSelector = () => {
  const { setOverlaySize } = useWindowResize();
  const [size, setSize] = useState<OverlaySize>(getOverlaySize());
  const masquer = raccourci("toggle_window");

  const choisir = (s: OverlaySize) => {
    setSize(s);
    setOverlaySizeStored(s);
    setOverlaySize(s);
  };

  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-t ov-divider select-none">
      <span className="text-[10px] font-semibold tracking-wider ov-muted">
        TAILLE
      </span>
      <div className="ov-group">
        {OVERLAY_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            className="ov-pill !h-6 !px-2.5 !text-[11px]"
            data-active={size === s}
            onClick={() => choisir(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      {masquer && (
        <span className="flex items-center gap-1.5 text-[11px] ov-muted">
          <span className="ov-kbd">{masquer}</span>
          masquer
        </span>
      )}
    </div>
  );
};
