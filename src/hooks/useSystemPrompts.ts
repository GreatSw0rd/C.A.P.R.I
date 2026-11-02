import { useCallback, useEffect, useState } from "react";
import {
  createSystemPrompt,
  getAllSystemPrompts,
  updateSystemPrompt,
  deleteSystemPrompt,
} from "@/lib/database";
import type {
  SystemPrompt,
  SystemPromptInput,
  UpdateSystemPromptInput,
} from "@/types";
import { DEFAULT_SYSTEM_PROMPT, STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "@/lib";
import { useApp } from "@/contexts";

function lireMasques(): number[] {
  try {
    const v = JSON.parse(
      safeLocalStorage.getItem(STORAGE_KEYS.OVERLAY_HIDDEN_PROMPTS) || "[]"
    );
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

// Previent l'autre fenetre que la liste des prompts a change.
function signalerChangement() {
  safeLocalStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS_VERSION, String(Date.now()));
}

export const useSystemPrompts = () => {
  const { setSystemPrompt } = useApp();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(
    () => {
      const stored = safeLocalStorage.getItem(
        STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID
      );
      return stored ? Number(stored) : null;
    }
  );
  const [hiddenPromptIds, setHiddenPromptIds] = useState<number[]>(lireMasques);

  /**
   * Fetch all system prompts from database
   */
  const fetchPrompts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getAllSystemPrompts();
      setPrompts(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch system prompts";
      setError(errorMessage);
      console.error("Error fetching system prompts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new system prompt
   */
  const createPrompt = useCallback(
    async (input: SystemPromptInput): Promise<SystemPrompt> => {
      try {
        setError(null);
        const result = await createSystemPrompt(input);
        await fetchPrompts(); // Refresh list
        signalerChangement();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create system prompt";
        setError(errorMessage);
        console.error("Error creating system prompt:", err);
        throw err;
      }
    },
    [fetchPrompts]
  );

  /**
   * Update an existing system prompt
   */
  const updatePrompt = useCallback(
    async (
      id: number,
      input: UpdateSystemPromptInput
    ): Promise<SystemPrompt> => {
      try {
        setError(null);
        const result = await updateSystemPrompt(id, input);
        await fetchPrompts(); // Refresh list
        signalerChangement();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update system prompt";
        setError(errorMessage);
        console.error("Error updating system prompt:", err);
        throw err;
      }
    },
    [fetchPrompts]
  );

  /**
   * Delete a system prompt
   */
  const deletePrompt = useCallback(
    async (id: number): Promise<void> => {
      try {
        setError(null);
        await deleteSystemPrompt(id);
        await fetchPrompts(); // Refresh list
        signalerChangement();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete system prompt";
        setError(errorMessage);
        console.error("Error deleting system prompt:", err);
        throw err;
      }
    },
    [fetchPrompts]
  );

  /**
   * Refresh prompts list
   */
  const refreshPrompts = useCallback(async () => {
    await fetchPrompts();
  }, [fetchPrompts]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch prompts on mount
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Synchronise l'overlay et le tableau de bord (deux fenetres separees) : liste des
  // prompts, prompt actif et prompts affiches dans l'overlay.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SYSTEM_PROMPTS_VERSION) {
        fetchPrompts();
      } else if (e.key === STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID) {
        setSelectedPromptId(e.newValue ? Number(e.newValue) : null);
      } else if (e.key === STORAGE_KEYS.OVERLAY_HIDDEN_PROMPTS) {
        setHiddenPromptIds(lireMasques());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchPrompts]);

  /**
   * Load selected prompt on mount and when prompts change
   */
  useEffect(() => {
    if (selectedPromptId && prompts.length > 0) {
      const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
      if (selectedPrompt) {
        setSystemPrompt(selectedPrompt.prompt);
      } else {
        // Selected prompt was deleted, reset to default
        setSelectedPromptId(null);
        safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID);
        const currentPrompt = safeLocalStorage.getItem(
          STORAGE_KEYS.SYSTEM_PROMPT
        );
        if (!currentPrompt) {
          setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
          safeLocalStorage.setItem(
            STORAGE_KEYS.SYSTEM_PROMPT,
            DEFAULT_SYSTEM_PROMPT
          );
        }
      }
    }
  }, [prompts, selectedPromptId, setSystemPrompt]);

  /**
   * Handle selecting a prompt
   */
  const handleSelectPrompt = useCallback(
    (promptId: number) => {
      const selectedPrompt = prompts.find((p) => p.id === promptId);
      if (selectedPrompt) {
        setSystemPrompt(selectedPrompt.prompt);
        setSelectedPromptId(promptId);
        safeLocalStorage.setItem(
          STORAGE_KEYS.SYSTEM_PROMPT,
          selectedPrompt.prompt
        );
        safeLocalStorage.setItem(
          STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID,
          promptId.toString()
        );
        // Nettoyage d'une éventuelle ancienne clé de prompt communautaire.
        safeLocalStorage.removeItem("selected_pluely_prompt");
      }
    },
    [prompts, setSystemPrompt]
  );

  /**
   * Desactive le prompt actif : l'IA revient au prompt par defaut.
   */
  const handleDeselectPrompt = useCallback(() => {
    setSelectedPromptId(null);
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID);
    safeLocalStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT);
  }, [setSystemPrompt]);

  /**
   * Affiche ou masque un prompt dans le selecteur de l'overlay.
   */
  const toggleOverlayPrompt = useCallback((promptId: number) => {
    setHiddenPromptIds((prev) => {
      const next = prev.includes(promptId)
        ? prev.filter((id) => id !== promptId)
        : [...prev, promptId];
      safeLocalStorage.setItem(
        STORAGE_KEYS.OVERLAY_HIDDEN_PROMPTS,
        JSON.stringify(next)
      );
      return next;
    });
  }, []);

  return {
    prompts,
    isLoading,
    error,
    selectedPromptId,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refreshPrompts,
    clearError,
    handleSelectPrompt,
    handleDeselectPrompt,
    hiddenPromptIds,
    toggleOverlayPrompt,
  };
};
