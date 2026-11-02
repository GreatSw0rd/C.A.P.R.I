import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useCallback, useEffect } from "react";
import { getOverlayHeight, overlayHeightFor, OverlaySize } from "@/lib";

// L'overlay est desormais un chat toujours ouvert : la fenetre garde la hauteur choisie par
// l'utilisateur (taille S/M/L/XL/Full). resizeWindow applique simplement cette hauteur ;
// le parametre `expanded` est conserve pour compatibilite mais n'a plus d'effet de repli.
export const useWindowResize = () => {
  const appliquerHauteur = useCallback(async (hauteur: number) => {
    try {
      const window = getCurrentWebviewWindow();
      await invoke("set_window_height", { window, height: hauteur });
    } catch (error) {
      console.error("Failed to resize window:", error);
    }
  }, []);

  const resizeWindow = useCallback(
    async (_expanded?: boolean) => {
      await appliquerHauteur(getOverlayHeight());
    },
    [appliquerHauteur]
  );

  // Applique une taille precise (depuis le selecteur de taille).
  const setOverlaySize = useCallback(
    async (size: OverlaySize) => {
      await appliquerHauteur(overlayHeightFor(size));
    },
    [appliquerHauteur]
  );

  // Au montage, applique la hauteur choisie pour ouvrir le chat directement.
  useEffect(() => {
    resizeWindow();
  }, [resizeWindow]);

  return { resizeWindow, setOverlaySize };
};

interface UseWindowFocusOptions {
  onFocusLost?: () => void;
  onFocusGained?: () => void;
}

export const useWindowFocus = ({
  onFocusLost,
  onFocusGained,
}: UseWindowFocusOptions = {}) => {
  const handleFocusChange = useCallback(
    async (focused: boolean) => {
      if (focused && onFocusGained) {
        onFocusGained();
      } else if (!focused && onFocusLost) {
        onFocusLost();
      }
    },
    [onFocusLost, onFocusGained]
  );

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupFocusListener = async () => {
      try {
        const window = getCurrentWebviewWindow();

        // Listen to focus change events
        unlisten = await window.onFocusChanged(({ payload: focused }) => {
          handleFocusChange(focused);
        });
      } catch (error) {
        console.error("Failed to setup focus listener:", error);
      }
    };

    setupFocusListener();

    // Cleanup
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [handleFocusChange]);
};
