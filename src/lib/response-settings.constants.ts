export interface ResponseLengthOption {
  id: "short" | "medium" | "auto";
  title: string;
  description: string;
  prompt: string;
}

export interface LanguageOption {
  id: string;
  name: string;
  flag: string;
  prompt: string;
}

export const RESPONSE_LENGTHS: ResponseLengthOption[] = [
  {
    id: "short",
    title: "Courte",
    description:
      "Réponses rapides en 2 à 4 phrases, idéal pendant un appel.",
    prompt:
      "IMPORTANT: You must keep your response extremely brief and concise. Limit your answer to 2-4 sentences maximum. Provide only the most essential information. Do not include explanations, examples, or additional context unless explicitly requested. Get straight to the point. This is a strict requirement.",
  },
  {
    id: "medium",
    title: "Moyenne",
    description: "Réponses équilibrées, avec les explications utiles.",
    prompt:
      "IMPORTANT: Provide responses with moderate length - not too brief, not too lengthy. Keep your answer to 1-2 paragraphs (approximately 4-8 sentences). Include key explanations and relevant details, but avoid being overly verbose or adding unnecessary elaboration. Stay focused and well-organized. This is a strict requirement.",
  },
  {
    id: "auto",
    title: "Automatique",
    description:
      "L'IA adapte la longueur à la complexité de la question.",
    prompt:
      "IMPORTANT: Carefully assess the complexity and scope of the question, then adjust your response length accordingly. For simple questions, be brief (2-4 sentences). For moderate questions, provide balanced detail (1-2 paragraphs). For complex questions, give comprehensive answers with appropriate depth. Always match the response length to what the question actually requires - no more, no less.",
  },
];

export const LANGUAGES: LanguageOption[] = [
  {
    id: "english",
    name: "Anglais",
    flag: "🇺🇸",
    prompt: "Respond in English.",
  },
  {
    id: "spanish",
    name: "Espagnol",
    flag: "🇪🇸",
    prompt: "Respond in Spanish (Español).",
  },
  {
    id: "french",
    name: "Français",
    flag: "🇫🇷",
    prompt: "Respond in French (Français).",
  },
  {
    id: "german",
    name: "Allemand",
    flag: "🇩🇪",
    prompt: "Respond in German (Deutsch).",
  },
  {
    id: "italian",
    name: "Italien",
    flag: "🇮🇹",
    prompt: "Respond in Italian (Italiano).",
  },
  {
    id: "portuguese",
    name: "Portugais",
    flag: "🇵🇹",
    prompt: "Respond in Portuguese (Português).",
  },
  {
    id: "dutch",
    name: "Néerlandais",
    flag: "🇳🇱",
    prompt: "Respond in Dutch (Nederlands).",
  },
  {
    id: "russian",
    name: "Russe",
    flag: "🇷🇺",
    prompt: "Respond in Russian (Русский).",
  },
  {
    id: "chinese",
    name: "Chinois",
    flag: "🇨🇳",
    prompt: "Respond in Simplified Chinese (简体中文).",
  },
  {
    id: "japanese",
    name: "Japonais",
    flag: "🇯🇵",
    prompt: "Respond in Japanese (日本語).",
  },
  {
    id: "korean",
    name: "Coréen",
    flag: "🇰🇷",
    prompt: "Respond in Korean (한국어).",
  },
  {
    id: "arabic",
    name: "Arabe",
    flag: "🇸🇦",
    prompt: "Respond in Arabic (العربية).",
  },
  {
    id: "turkish",
    name: "Turc",
    flag: "🇹🇷",
    prompt: "Respond in Turkish (Türkçe).",
  },
  {
    id: "polish",
    name: "Polonais",
    flag: "🇵🇱",
    prompt: "Respond in Polish (Polski).",
  },
  {
    id: "swedish",
    name: "Suédois",
    flag: "🇸🇪",
    prompt: "Respond in Swedish (Svenska).",
  },
  {
    id: "norwegian",
    name: "Norvégien",
    flag: "🇳🇴",
    prompt: "Respond in Norwegian (Norsk).",
  },
  {
    id: "danish",
    name: "Danois",
    flag: "🇩🇰",
    prompt: "Respond in Danish (Dansk).",
  },
  {
    id: "finnish",
    name: "Finnois",
    flag: "🇫🇮",
    prompt: "Respond in Finnish (Suomi).",
  },
  {
    id: "greek",
    name: "Grec",
    flag: "🇬🇷",
    prompt: "Respond in Greek (Ελληνικά).",
  },
  {
    id: "czech",
    name: "Tchèque",
    flag: "🇨🇿",
    prompt: "Respond in Czech (Čeština).",
  },
  {
    id: "hungarian",
    name: "Hongrois",
    flag: "🇭🇺",
    prompt: "Respond in Hungarian (Magyar).",
  },
  {
    id: "romanian",
    name: "Roumain",
    flag: "🇷🇴",
    prompt: "Respond in Romanian (Română).",
  },
  {
    id: "ukrainian",
    name: "Ukrainien",
    flag: "🇺🇦",
    prompt: "Respond in Ukrainian (Українська).",
  },
  {
    id: "vietnamese",
    name: "Vietnamien",
    flag: "🇻🇳",
    prompt: "Respond in Vietnamese (Tiếng Việt).",
  },
  {
    id: "thai",
    name: "Thaï",
    flag: "🇹🇭",
    prompt: "Respond in Thai (ไทย).",
  },
  {
    id: "indonesian",
    name: "Indonésien",
    flag: "🇮🇩",
    prompt: "Respond in Indonesian (Bahasa Indonesia).",
  },
  {
    id: "malay",
    name: "Malais",
    flag: "🇲🇾",
    prompt: "Respond in Malay (Bahasa Melayu).",
  },
  {
    id: "hebrew",
    name: "Hébreu",
    flag: "🇮🇱",
    prompt: "Respond in Hebrew (עברית).",
  },
  {
    id: "filipino",
    name: "Philippin",
    flag: "🇵🇭",
    prompt: "Respond in Filipino (Tagalog).",
  },
];

export const DEFAULT_RESPONSE_LENGTH = "auto";
export const DEFAULT_LANGUAGE = "english";
export const DEFAULT_AUTO_SCROLL = true;
