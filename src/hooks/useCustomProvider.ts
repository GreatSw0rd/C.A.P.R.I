import { useState } from "react";
import { TYPE_PROVIDER } from "@/types";
import { MODELES_LLM } from "@/config";
import { useApp } from "@/contexts";
import {
  getCustomAiProviders,
  addCustomAiProvider,
  updateCustomAiProvider,
  removeCustomAiProvider,
  validateCurl,
} from "@/lib";

export function useCustomAiProviders() {
  const { loadData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<TYPE_PROVIDER>({
    id: "",
    streaming: false,
    responseContentPath: "",
    isCustom: true,
    curl: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Modele conseille pour le modele choisi dans "Remplissage auto", a saisir dans MODEL.
  const [modeleConseille, setModeleConseille] = useState<string | null>(null);

  const handleEdit = (providerId: string) => {
    const customProviders = getCustomAiProviders();
    const provider = customProviders.find((p) => p.id === providerId);
    if (!provider) return;

    setFormData({
      ...provider,
    });
    setEditingProvider(providerId);
    setShowForm(true);
    setErrors({});
  };

  const handleAutoFill = (modeleId: string) => {
    const modele = MODELES_LLM.find((m) => m.id === modeleId);
    if (!modele) return;

    setFormData((prev) => ({
      ...prev,
      curl: modele.curl,
      streaming: modele.streaming,
      responseContentPath: modele.responseContentPath,
      name: prev.name || modele.nom,
    }));
    setModeleConseille(modele.modeleConseille);

    setErrors({});
  };

  const handleDelete = (providerId: string) => {
    setDeleteConfirm(providerId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const success = removeCustomAiProvider(deleteConfirm);
      if (success) {
        setDeleteConfirm(null);
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error("Error deleting custom provider:", error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    // Validate form
    const newErrors: { [key: string]: string } = {};

    if (!formData.curl.trim()) {
      newErrors.curl = "Curl command is required";
    } else {
      const validation = validateCurl(formData.curl, ["TEXT"]);
      if (!validation.isValid) {
        newErrors.curl = validation.message || "";
      }
    }

    if (!formData.responseContentPath?.trim()) {
      newErrors.responseContentPath = "Response content path is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      if (editingProvider) {
        // Update existing provider
        const success = updateCustomAiProvider(editingProvider, {
          name: formData.name?.trim() || undefined,
          curl: formData.curl,
          streaming: formData.streaming,
          responseContentPath: formData.responseContentPath,
        });

        if (success) {
          setEditingProvider(null);
          setShowForm(false);
          setFormData({
            id: "",
            streaming: false,
            responseContentPath: "",
            isCustom: true,
            curl: "",
          });
          loadData(); // Refresh data
        }
      } else {
        // Create new provider
        const newProvider = {
          name: formData.name?.trim() || undefined,
          curl: formData.curl,
          streaming: formData.streaming,
          responseContentPath: formData.responseContentPath,
        };

        const saved = addCustomAiProvider(newProvider);
        if (saved) {
          setShowForm(false);
          setFormData({
            id: "",
            streaming: false,
            responseContentPath: "",
            isCustom: true,
            curl: "",
          });
          loadData(); // Refresh data
        }
      }
    } catch (error) {
      console.error("Error saving custom provider:", error);
    }
  };

  return {
    errors,
    setErrors,
    showForm,
    setShowForm,
    editingProvider,
    setEditingProvider,
    deleteConfirm,
    formData,
    setFormData,
    handleSave,
    handleAutoFill,
    modeleConseille,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
  };
}
