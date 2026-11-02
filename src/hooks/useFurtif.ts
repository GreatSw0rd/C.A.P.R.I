import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// Statut renvoye par le backend (furtif.rs).
export interface StatutFurtif {
  configure: boolean;
  deverrouille: boolean;
  actif: boolean;
}

const STATUT_INITIAL: StatutFurtif = {
  configure: false,
  deverrouille: false,
  actif: false,
};

/**
 * Pilote le mode furtif : lecture du statut, definition/verification du mot de passe,
 * activation de la protection d'ecran et verrouillage. Le backend reinitialise toujours
 * le mode a l'arret ; ce hook ne fait que refleter et commander cet etat.
 */
export const useFurtif = () => {
  const [statut, setStatut] = useState<StatutFurtif>(STATUT_INITIAL);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    try {
      const s = await invoke<StatutFurtif>("statut_furtif");
      setStatut(s);
    } catch (error) {
      console.error("Lecture du statut furtif impossible :", error);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    rafraichir();
    const unlisten = listen<StatutFurtif>("furtif-change", (event) => {
      setStatut(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [rafraichir]);

  const definirMotDePasse = useCallback(async (motDePasse: string) => {
    await invoke("definir_mot_de_passe_furtif", { motDePasse });
    await invoke<StatutFurtif>("statut_furtif").then(setStatut);
  }, []);

  // Renvoie true si le mot de passe est correct.
  const deverrouiller = useCallback(async (motDePasse: string) => {
    return await invoke<boolean>("deverrouiller_furtif", { motDePasse });
  }, []);

  const verrouiller = useCallback(async () => {
    await invoke("verrouiller_furtif");
  }, []);

  const activer = useCallback(async (actif: boolean) => {
    await invoke<StatutFurtif>("activer_furtif", { actif });
  }, []);

  return {
    statut,
    chargement,
    rafraichir,
    definirMotDePasse,
    deverrouiller,
    verrouiller,
    activer,
  };
};
