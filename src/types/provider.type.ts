export interface TYPE_PROVIDER {
  id?: string;
  streaming?: boolean;
  responseContentPath?: string;
  isCustom?: boolean;
  /** Nom affiche (fournisseurs personnalises). */
  name?: string;
  curl: string;
}
