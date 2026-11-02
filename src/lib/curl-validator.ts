import curl2Json from "@bany/curl-to-json";

export interface CurlValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateCurl = (
  curl: string,
  requiredVariables: string[]
): CurlValidationResult => {
  if (!curl.trim().startsWith("curl")) {
    return {
      isValid: false,
      message: "La commande doit commencer par « curl ».",
    };
  }

  try {
    curl2Json(curl);
  } catch (error) {
    return {
      isValid: false,
      message:
        "Commande curl invalide : vérifiez les guillemets et les barres obliques inverses.",
    };
  }

  const missingVariables = requiredVariables.filter(
    (variable) => !curl.includes(`{{${variable}}}`)
  );

  if (missingVariables.length > 0) {
    const missingVarsString = missingVariables
      .map((v) => `{{${v}}}`)
      .join(", ");
    return {
      isValid: false,
      message: `Variables obligatoires manquantes : ${missingVarsString}.`,
    };
  }

  return { isValid: true };
};
