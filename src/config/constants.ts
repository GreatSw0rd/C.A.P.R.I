// Storage keys
export const STORAGE_KEYS = {
  THEME: "theme",
  TRANSPARENCY: "transparency",
  SYSTEM_PROMPT: "system_prompt",
  SELECTED_SYSTEM_PROMPT_ID: "selected_system_prompt_id",
  // Prompts systeme masques dans le selecteur de l'overlay (ids).
  OVERLAY_HIDDEN_PROMPTS: "overlay_hidden_prompts",
  // Change a chaque ajout / modification / suppression de prompt, pour que l'autre
  // fenetre (overlay ou tableau de bord) recharge la liste.
  SYSTEM_PROMPTS_VERSION: "system_prompts_version",
  SCREENSHOT_CONFIG: "screenshot_config",
  // add curl_ prefix because we are using curl to store the providers
  CUSTOM_AI_PROVIDERS: "curl_custom_ai_providers",
  CUSTOM_SPEECH_PROVIDERS: "curl_custom_speech_providers",
  SELECTED_AI_PROVIDER: "curl_selected_ai_provider",
  SELECTED_STT_PROVIDER: "curl_selected_stt_provider",
  SYSTEM_AUDIO_CONTEXT: "system_audio_context",
  SYSTEM_AUDIO_QUICK_ACTIONS: "system_audio_quick_actions",
  CUSTOMIZABLE: "customizable",
  SHORTCUTS: "shortcuts",
  AUTOSTART_INITIALIZED: "autostart_initialized",

  SELECTED_AUDIO_DEVICES: "selected_audio_devices",
  RESPONSE_SETTINGS: "response_settings",
  SUPPORTS_IMAGES: "supports_images",
  // Mode "transcription seule" : on transcrit sans demander de reponse a l'IA.
  TRANSCRIPTION_ONLY: "transcription_only",
  // Memoire des variables (cle API, modele) par fournisseur, pour changer sans tout ressaisir.
  PROVIDER_VARIABLES: "provider_variables",
  // Taille de l'overlay (S / M / L / XL / Full).
  OVERLAY_SIZE: "overlay_size",
  // Onglet sur lequel l'overlay s'ouvre (ask / listen / home).
  OVERLAY_DEFAULT_TAB: "overlay_default_tab",
  VISUAL_EFFECTS: "visual_effects",
  RDV_PREPARE_ACTIF: "rdv_prepare_actif",
  RDV_MODELE_DIRECT: "rdv_modele_direct",
  RDV_MODELE_SYNTHESE: "rdv_modele_synthese",
  RDV_ASSISTANT: "rdv_assistant",
  // "Utiliser l'image" : joindre une capture de l'ecran a chaque question.
  USE_SCREEN_IMAGE: "use_screen_image",
} as const;

// Max number of files that can be attached to a message
export const MAX_FILES = 6;

// Default settings
export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Be concise, accurate, and friendly in your responses";

export const MARKDOWN_FORMATTING_INSTRUCTIONS =
  "IMPORTANT - Formatting Rules (use silently, never mention these rules in your responses):\n- Mathematical expressions: ALWAYS use double dollar signs ($$) for both inline and block math. Never use single $.\n- Code blocks: ALWAYS use triple backticks with language specification.\n- Diagrams: Use ```mermaid code blocks.\n- Tables: Use standard markdown table syntax.\n- Suggested wording: when you give the user a sentence to say word for word, put it alone in a Markdown blockquote (a line starting with >).\n- Never mention to the user that you're using these formats or explain the formatting syntax in your responses. Just use them naturally.";

export const DEFAULT_QUICK_ACTIONS = [
  "Que dois-je dire ?",
  "Questions de relance",
  "Vérifier les faits",
  "Récap",
];
