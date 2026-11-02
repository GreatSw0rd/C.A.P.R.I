import {
  buildDynamicMessages,
  deepVariableReplacer,
  extractVariables,
  getByPath,
  getStreamingContent,
} from "./common.function";
import { Message, TYPE_PROVIDER } from "@/types";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import curl2Json from "@bany/curl-to-json";

// Fournisseurs "IA via CLI locale" (moteurs gratuits, voir cli_ia.rs) : id -> nom de l'outil.
const CLI_PROVIDERS: Record<string, string> = {
  "claude-cli": "claude",
  "gemini-cli": "gemini",
  "codex-cli": "codex",
  "qwen-cli": "qwen",
};
import { getResponseSettings, RESPONSE_LENGTHS, LANGUAGES } from "@/lib";
import { MARKDOWN_FORMATTING_INSTRUCTIONS } from "@/config/constants";

function buildEnhancedSystemPrompt(baseSystemPrompt?: string): string {
  const responseSettings = getResponseSettings();
  const prompts: string[] = [];

  if (baseSystemPrompt) {
    prompts.push(baseSystemPrompt);
  }

  const lengthOption = RESPONSE_LENGTHS.find(
    (l) => l.id === responseSettings.responseLength
  );
  if (lengthOption?.prompt?.trim()) {
    prompts.push(lengthOption.prompt);
  }

  const languageOption = LANGUAGES.find(
    (l) => l.id === responseSettings.language
  );
  if (languageOption?.prompt?.trim()) {
    prompts.push(languageOption.prompt);
  }

  // Add markdown formatting instructions
  prompts.push(MARKDOWN_FORMATTING_INSTRUCTIONS);

  return prompts.join(" ");
}

export async function* fetchAIResponse(params: {
  provider: TYPE_PROVIDER | undefined;
  selectedProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  systemPrompt?: string;
  history?: Message[];
  userMessage: string;
  imagesBase64?: string[];
  signal?: AbortSignal;
  /** Consigne utilisee telle quelle (sans longueur, langue ni Markdown ajoutes). */
  consigneBrute?: boolean;
  /** Demande une reponse JSON stricte (fournisseurs compatibles uniquement). */
  formatJson?: boolean;
  /** Temperature (0 = reponses plus regulieres). */
  temperature?: number;
}): AsyncIterable<string> {
  try {
    const {
      provider,
      selectedProvider,
      systemPrompt,
      history = [],
      userMessage,
      imagesBase64 = [],
      signal,
    } = params;

    // Check if already aborted
    if (signal?.aborted) {
      return;
    }

    const enhancedSystemPrompt = params.consigneBrute
      ? systemPrompt || ""
      : buildEnhancedSystemPrompt(systemPrompt);

    if (!provider) {
      throw new Error(`Provider not provided`);
    }
    if (!selectedProvider) {
      throw new Error(`Selected provider not provided`);
    }

    // Fournisseurs "IA via CLI locale" : pas de requete HTTP, on appelle l'outil en local.
    // Les images sont transmises en fichiers temporaires. La reponse est renvoyee d'un bloc.
    const outilCli = provider.id ? CLI_PROVIDERS[provider.id] : undefined;
    if (outilCli) {
      const modele =
        selectedProvider.variables?.model ||
        selectedProvider.variables?.MODEL ||
        undefined;
      // La CLI ne garde pas de memoire entre deux appels : on lui redonne les derniers echanges.
      const echanges = history
        .slice(-10)
        .map((m) => {
          const contenu =
            typeof m.content === "string"
              ? m.content
              : Array.isArray(m.content)
              ? m.content
                  .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
                  .join(" ")
              : "";
          const texte = contenu.length > 2000 ? contenu.slice(0, 2000) + "…" : contenu;
          return texte.trim()
            ? `${m.role === "assistant" ? "Assistant" : "Utilisateur"} : ${texte}`
            : "";
        })
        .filter(Boolean);
      const message = echanges.length
        ? `Conversation précédente :\n${echanges.join("\n")}\n\nNouveau message de l'utilisateur :\n${userMessage}`
        : userMessage;
      const texte = await invoke<string>("cli_chat", {
        outil: outilCli,
        message,
        systemPrompt: enhancedSystemPrompt || undefined,
        modele,
        images: imagesBase64.length ? imagesBase64 : undefined,
      });
      if (!signal?.aborted && texte) {
        yield texte;
      }
      return;
    }

    let curlJson;
    try {
      curlJson = curl2Json(provider.curl);
    } catch (error) {
      throw new Error(
        `Failed to parse curl: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    const extractedVariables = extractVariables(provider.curl);
    const requiredVars = extractedVariables.filter(
      ({ key }) => key !== "SYSTEM_PROMPT" && key !== "TEXT" && key !== "IMAGE"
    );
    for (const { key } of requiredVars) {
      if (
        !selectedProvider.variables?.[key] ||
        selectedProvider.variables[key].trim() === ""
      ) {
        throw new Error(
          `Missing required variable: ${key}. Please configure it in settings.`
        );
      }
    }

    if (!userMessage) {
      throw new Error("User message is required");
    }
    if (imagesBase64.length > 0 && !provider.curl.includes("{{IMAGE}}")) {
      throw new Error(
        `Provider ${provider?.id ?? "unknown"} does not support image input`
      );
    }

    // Corps de la requete pour une liste d'images donnee (vide = texte seul).
    const preparer = (images: string[]) => {
      let bodyObj: any = curlJson.data
        ? JSON.parse(JSON.stringify(curlJson.data))
        : {};
      const messagesKey = Object.keys(bodyObj).find((key) =>
        ["messages", "contents", "conversation", "history"].includes(key)
      );

      if (messagesKey && Array.isArray(bodyObj[messagesKey])) {
        const finalMessages = buildDynamicMessages(
          bodyObj[messagesKey],
          history,
          userMessage,
          images
        );
        bodyObj[messagesKey] = finalMessages;
      }

      const allVariables = {
        ...Object.fromEntries(
          // trim : une cle collee avec un espace ou un retour a la ligne est refusee (401).
          Object.entries(selectedProvider.variables).map(([key, value]) => [
            key.toUpperCase(),
            typeof value === "string" ? value.trim() : value,
          ])
        ),
        SYSTEM_PROMPT: enhancedSystemPrompt || "",
      };

      bodyObj = deepVariableReplacer(bodyObj, allVariables);
      let url = deepVariableReplacer(curlJson.url || "", allVariables);

      const headers = deepVariableReplacer(curlJson.header || {}, allVariables);
      headers["Content-Type"] = "application/json";

      // Reponses plus regulieres pour les usages structures (copilote de rendez-vous) :
      // temperature basse et, si le fournisseur le permet, format JSON impose.
      if (
        typeof bodyObj === "object" &&
        bodyObj !== null &&
        messagesKey === "messages"
      ) {
        if (typeof params.temperature === "number") {
          bodyObj.temperature = params.temperature;
        }
        if (params.formatJson && /api\.groq\.com|api\.openai\.com|openrouter\.ai|api\.mistral\.ai|api\.x\.ai/.test(String(url))) {
          bodyObj.response_format = { type: "json_object" };
        }
      }

      if (provider?.streaming) {
        if (typeof bodyObj === "object" && bodyObj !== null) {
          const streamKey = Object.keys(bodyObj).find(
            (k) => k.toLowerCase() === "stream"
          );
          if (streamKey) {
            bodyObj[streamKey] = true;
          } else {
            bodyObj.stream = true;
          }
        }
      }
      return { bodyObj, url, headers };
    };

    const envoyer = async (images: string[]) => {
      const { bodyObj, url, headers } = preparer(images);
      const fetchFunction = url?.includes("http") ? fetch : tauriFetch;
      return fetchFunction(url, {
        method: curlJson.method || "POST",
        headers,
        body: curlJson.method === "GET" ? undefined : JSON.stringify(bodyObj),
        signal,
      });
    };

    let response;
    try {
      response = await envoyer(imagesBase64);

      // Le LLM refuse l'image (modele texte seul, ex. gpt-oss) : on renvoie la question
      // sans la capture plutot que d'afficher une erreur.
      if (!response.ok && response.status === 400 && imagesBase64.length > 0) {
        const erreur = await response.clone().text().catch(() => "");
        if (/must be a string|image|vision|multimodal/i.test(erreur)) {
          response = await envoyer([]);
          if (response.ok) {
            yield "_(Ce LLM ne lit pas les images : question envoyée sans la capture d'écran.)_\n\n";
          }
        }
      }
    } catch (fetchError) {
      // Check if aborted
      if (
        signal?.aborted ||
        (fetchError instanceof Error && fetchError.name === "AbortError")
      ) {
        return; // Silently return on abort
      }
      yield `Network error during API request: ${
        fetchError instanceof Error ? fetchError.message : "Unknown error"
      }`;
      return;
    }

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {}
      yield `API request failed: ${response.status} ${response.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`;
      return;
    }

    if (!provider?.streaming) {
      let json;
      try {
        json = await response.json();
      } catch (parseError) {
        yield `Failed to parse non-streaming response: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`;
        return;
      }
      const content =
        getByPath(json, provider?.responseContentPath || "") || "";
      yield content;
      return;
    }

    if (!response.body) {
      yield "Streaming not supported or response body missing";
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      // Check if aborted
      if (signal?.aborted) {
        reader.cancel();
        return;
      }

      let readResult;
      try {
        readResult = await reader.read();
      } catch (readError) {
        // Check if aborted
        if (
          signal?.aborted ||
          (readError instanceof Error && readError.name === "AbortError")
        ) {
          return; // Silently return on abort
        }
        yield `Error reading stream: ${
          readError instanceof Error ? readError.message : "Unknown error"
        }`;
        return;
      }
      const { done, value } = readResult;
      if (done) break;

      // Check if aborted before processing
      if (signal?.aborted) {
        reader.cancel();
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const trimmed = line.substring(5).trim();
          if (!trimmed || trimmed === "[DONE]") continue;
          try {
            const parsed = JSON.parse(trimmed);
            const delta = getStreamingContent(
              parsed,
              provider?.responseContentPath || ""
            );
            if (delta) {
              yield delta;
            }
          } catch (e) {
            // Ignore parsing errors for partial JSON chunks
          }
        }
      }
    }
  } catch (error) {
    throw new Error(
      `Error in fetchAIResponse: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
