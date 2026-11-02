export const AI_PROVIDERS = [
  {
    id: "openai",
    curl: `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "claude",
    curl: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: {{API_KEY}}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-dangerous-direct-browser-access: true" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "{{MODEL}}",
    "system": "{{SYSTEM_PROMPT}}",
    "messages": [{"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "{{IMAGE}}"}}]}],
    "max_tokens": 1024
  }'`,
    responseContentPath: "content[0].text",
    streaming: true,
  },
  {
    id: "grok",
    curl: `curl https://api.x.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "gemini",
    curl: `curl "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'}`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "mistral",
    curl: `curl https://api.mistral.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": "data:image/png;base64,{{IMAGE}}"}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "cohere",
    curl: `curl -X POST https://api.cohere.ai/v2/chat \\
    -H "Authorization: Bearer {{API_KEY}}" \\
    -H "Content-Type: application/json" \\
    -d '{
      "model": "{{MODEL}}",
      "preamble": "{{SYSTEM_PROMPT}}",
      "messages": [{"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
    }'`,
    responseContentPath: "message.content[0].text",
    streaming: true,
  },
  {
    id: "groq",
    curl: `curl https://api.groq.com/openai/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer {{API_KEY}}" \
    -d '{
      "model": "{{MODEL}}",
      "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}],
      "temperature": 1,
      "max_completion_tokens": 8192,
      "top_p": 1,
      "stream": true,
      "reasoning_effort": "medium",
      "stop": null
    }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "perplexity",
    curl: `curl -X POST https://api.perplexity.ai/chat/completions \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "openrouter",
    curl: `  curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    id: "ollama",
    curl: `curl -X POST http://localhost:11434/v1/chat/completions \\
    -H "Authorization: Bearer {{API_KEY}}" \\
    -H "Content-Type: application/json" \\
    -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    // LM Studio : serveur local compatible OpenAI (par défaut http://localhost:1234).
    // La clé d'API n'est pas vérifiée en local : mettez n'importe quelle valeur, par exemple "lm-studio".
    id: "lmstudio",
    curl: `curl -X POST http://localhost:1234/v1/chat/completions \\
    -H "Authorization: Bearer {{API_KEY}}" \\
    -H "Content-Type: application/json" \\
    -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  {
    // llama.cpp : serveur local "llama-server" compatible OpenAI (par défaut http://localhost:8080).
    // La clé d'API n'est pas vérifiée en local : mettez n'importe quelle valeur.
    id: "llamacpp",
    curl: `curl -X POST http://localhost:8080/v1/chat/completions \\
    -H "Authorization: Bearer {{API_KEY}}" \\
    -H "Content-Type: application/json" \\
    -d '{
    "model": "{{MODEL}}",
    "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}]}]
  }'`,
    responseContentPath: "choices[0].message.content",
    streaming: true,
  },
  // IA via CLI locale (gratuit) : utilisent un outil installe et connecte sur la machine au lieu
  // d'une API payante. Aucune cle requise, entree texte uniquement. Le "curl" est une sentinelle :
  // aucune requete HTTP n'est faite, fetchAIResponse detecte l'id et appelle la commande Rust
  // cli_chat avec l'outil correspondant. Le champ Modele est optionnel (laisser vide = defaut CLI).
  {
    // Claude Code. Modele : "sonnet", "opus", "haiku" ou un id complet.
    id: "claude-cli",
    curl: `curl cli://local/chat -d '{"model":"{{MODEL}}","message":"{{TEXT}}","images":"{{IMAGE}}"}'`,
    responseContentPath: "",
    streaming: false,
  },
  {
    // Gemini CLI. Modele : par ex. "gemini-2.5-pro" ou vide pour le defaut.
    id: "gemini-cli",
    curl: `curl cli://local/chat -d '{"model":"{{MODEL}}","message":"{{TEXT}}","images":"{{IMAGE}}"}'`,
    responseContentPath: "",
    streaming: false,
  },
  {
    // OpenAI Codex CLI. Modele : par ex. "gpt-5-codex" ou vide pour le defaut.
    id: "codex-cli",
    curl: `curl cli://local/chat -d '{"model":"{{MODEL}}","message":"{{TEXT}}","images":"{{IMAGE}}"}'`,
    responseContentPath: "",
    streaming: false,
  },
  {
    // Qwen Code CLI. Modele : par ex. "qwen3-coder-plus" ou vide pour le defaut.
    id: "qwen-cli",
    curl: `curl cli://local/chat -d '{"model":"{{MODEL}}","message":"{{TEXT}}","images":"{{IMAGE}}"}'`,
    responseContentPath: "",
    streaming: false,
  },
];
