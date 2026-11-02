// Modeles proposes par "Remplissage auto" quand on ajoute un LLM : commandes curl a jour,
// avec le nom de modele conseille a saisir ensuite dans le champ MODEL.
export type ModeleLlm = {
  id: string;
  libelle: string;
  nom: string;
  modeleConseille: string;
  curl: string;
  responseContentPath: string;
  streaming: boolean;
};

export const MODELES_LLM: ModeleLlm[] = [
  {
    id: "groq-texte",
    libelle: "Groq · texte rapide",
    nom: "Groq texte",
    modeleConseille: "openai/gpt-oss-120b",
    curl: `curl https://api.groq.com/openai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [
      {"role": "system", "content": "{{SYSTEM_PROMPT}}"},
      {"role": "user", "content": "{{TEXT}}"}
    ],
    "stream": true,
    "reasoning_effort": "low",
    "include_reasoning": false
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "groq-vision",
    libelle: "Groq · avec images",
    nom: "Groq vision",
    modeleConseille: "qwen/qwen3.8-27b",
    curl: `curl https://api.groq.com/openai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [
      {"role": "system", "content": "{{SYSTEM_PROMPT}}"},
      {"role": "user", "content": [
        {"type": "text", "text": "{{TEXT}}"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}
      ]}
    ],
    "stream": true,
    "reasoning_effort": "none"
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "mistral",
    libelle: "Mistral · meilleur français",
    nom: "Mistral",
    modeleConseille: "mistral-medium-latest",
    curl: `curl https://api.mistral.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [
      {"role": "system", "content": "{{SYSTEM_PROMPT}}"},
      {"role": "user", "content": "{{TEXT}}"}
    ],
    "stream": true
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "openai",
    libelle: "OpenAI · avec images",
    nom: "OpenAI",
    modeleConseille: "nom du modèle sur platform.openai.com",
    curl: `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [
      {"role": "system", "content": "{{SYSTEM_PROMPT}}"},
      {"role": "user", "content": [
        {"type": "text", "text": "{{TEXT}}"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}
      ]}
    ],
    "stream": true
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "openrouter",
    libelle: "OpenRouter · des centaines de modèles",
    nom: "OpenRouter",
    modeleConseille: "nom du modèle sur openrouter.ai/models",
    curl: `curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [
      {"role": "system", "content": "{{SYSTEM_PROMPT}}"},
      {"role": "user", "content": "{{TEXT}}"}
    ],
    "stream": true
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "ollama",
    libelle: "Ollama · local, sans clé",
    nom: "Ollama",
    modeleConseille: "nom d'un modèle installé (ollama list)",
    curl: `curl http://localhost:11434/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [
      {"role": "system", "content": "{{SYSTEM_PROMPT}}"},
      {"role": "user", "content": "{{TEXT}}"}
    ],
    "stream": true
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
];
