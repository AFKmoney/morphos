// LLM Provider types and registry

export type ProviderId =
  | "zai"
  | "openai"
  | "anthropic"
  | "mistral"
  | "nvidia"
  | "lmstudio"
  | "ollama"
  | "groq"
  | "openrouter"
  | "together"
  | "cohere"
  | "deepseek"
  | "xai"
  | "custom";

export type ApiStyle = "openai" | "anthropic" | "cohere";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  description: string;
  baseUrl: string;
  requiresKey: boolean;
  keyOptional?: boolean;
  keyHint: string;
  docsUrl: string;
  defaultModel: string;
  models: string[];
  apiStyle: ApiStyle;
  local?: boolean;
  baseUrlEditable: boolean;
  accent: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  zai: {
    id: "zai",
    label: "Z.ai (GLM)",
    description: "GLM-4.6 — built-in or your own key",
    baseUrl: "https://api.z.ai/api/paas/v4",
    requiresKey: false,
    keyOptional: true,
    keyHint: "Optional — use your own Z.ai API key",
    docsUrl: "https://z.ai",
    defaultModel: "glm-4.6",
    models: ["glm-4.6", "glm-4.5", "glm-4-plus"],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#22d3ee",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    description: "GPT-4o, GPT-4o-mini, o1, o3-mini",
    baseUrl: "https://api.openai.com/v1",
    requiresKey: true,
    keyHint: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "o1-mini", "o3-mini"],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#10a37f",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    description: "Claude 3.5 Sonnet, Haiku, Opus",
    baseUrl: "https://api.anthropic.com/v1",
    requiresKey: true,
    keyHint: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-3-5-haiku-latest",
    models: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest", "claude-3-opus-latest", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    apiStyle: "anthropic",
    baseUrlEditable: true,
    accent: "#d97757",
  },
  mistral: {
    id: "mistral",
    label: "Mistral AI",
    description: "Mistral Large, Codestral, Pixtral",
    baseUrl: "https://api.mistral.ai/v1",
    requiresKey: true,
    keyHint: "xxx... (32 chars)",
    docsUrl: "https://console.mistral.ai/api-keys",
    defaultModel: "mistral-small-latest",
    models: ["mistral-small-latest", "mistral-large-latest", "codestral-latest", "pixtral-large-latest", "open-mistral-7b", "open-mixtral-8x7b"],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#fa520f",
  },
  nvidia: {
    id: "nvidia",
    label: "NVIDIA NIM",
    description: "Kimi K2.5, Llama, Nemotron via NVIDIA",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    requiresKey: true,
    keyHint: "nvapi-...",
    docsUrl: "https://build.nvidia.com",
    defaultModel: "moonshotai/kimi-k2.5",
    models: [
      "moonshotai/kimi-k2.5",
      "meta/llama-3.1-8b-instruct",
      "meta/llama-3.1-70b-instruct",
      "nvidia/llama-3.1-nemotron-70b-instruct",
      "nvidia/nemotron-mini-4b-instruct",
      "mistralai/mixtral-8x7b-instruct-v0.1",
      "qwen/qwen2.5-7b-instruct",
      "deepseek-ai/deepseek-r1",
    ],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#76b900",
  },
  lmstudio: {
    id: "lmstudio",
    label: "LM Studio",
    description: "Local · OpenAI-compatible",
    baseUrl: "http://localhost:1234/v1",
    requiresKey: false,
    keyHint: "lm-studio",
    docsUrl: "https://lmstudio.ai/docs/local-server",
    defaultModel: "local-model",
    models: ["local-model"],
    apiStyle: "openai",
    local: true,
    baseUrlEditable: true,
    accent: "#a855f7",
  },
  ollama: {
    id: "ollama",
    label: "Ollama",
    description: "Local · Llama, Mistral, Qwen",
    baseUrl: "http://localhost:11434/v1",
    requiresKey: false,
    keyHint: "ollama",
    docsUrl: "https://ollama.com",
    defaultModel: "llama3.2",
    models: ["llama3.2", "llama3.1", "mistral", "qwen2.5", "phi3", "gemma2", "deepseek-r1"],
    apiStyle: "openai",
    local: true,
    baseUrlEditable: true,
    accent: "#22d3ee",
  },
  groq: {
    id: "groq",
    label: "Groq",
    description: "Ultra-fast inference · Llama, Mixtral",
    baseUrl: "https://api.groq.com/openai/v1",
    requiresKey: true,
    keyHint: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it", "deepseek-r1-distill-llama-70b"],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#f55036",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    description: "100+ models via one API",
    baseUrl: "https://openrouter.ai/api/v1",
    requiresKey: true,
    keyHint: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/settings/keys",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3.5-haiku",
      "google/gemini-flash-1.5",
      "meta-llama/llama-3.3-70b-instruct",
      "mistralai/mistral-large",
      "deepseek/deepseek-chat",
      "qwen/qwen-2.5-72b-instruct",
      "x-ai/grok-2",
    ],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#8b5cf6",
  },
  together: {
    id: "together",
    label: "Together AI",
    description: "Open-source models at scale",
    baseUrl: "https://api.together.xyz/v1",
    requiresKey: true,
    keyHint: "xxx...",
    docsUrl: "https://api.together.ai/settings/api-keys",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
      "deepseek-ai/DEEPSEEK-R1",
    ],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#0f6fff",
  },
  cohere: {
    id: "cohere",
    label: "Cohere",
    description: "Command R, Command R+",
    baseUrl: "https://api.cohere.com/v2",
    requiresKey: true,
    keyHint: "xxx...",
    docsUrl: "https://dashboard.cohere.com/api-keys",
    defaultModel: "command-r-08-2024",
    models: ["command-r-08-2024", "command-r-plus-08-2024", "command-r", "command-r-plus", "command-light"],
    apiStyle: "cohere",
    baseUrlEditable: true,
    accent: "#39594d",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    description: "DeepSeek-V3, DeepSeek-R1",
    baseUrl: "https://api.deepseek.com/v1",
    requiresKey: true,
    keyHint: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#4f8bf7",
  },
  xai: {
    id: "xai",
    label: "xAI (Grok)",
    description: "Grok — OpenAI-compatible xAI API",
    baseUrl: "https://api.x.ai/v1",
    requiresKey: true,
    keyHint: "xai-...",
    docsUrl: "https://docs.x.ai",
    defaultModel: "grok-4",
    models: ["grok-4", "grok-3", "grok-3-mini", "grok-2"],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#e8e8e8",
  },
  custom: {
    id: "custom",
    label: "Custom endpoint",
    description: "Any OpenAI-compatible API",
    baseUrl: "http://localhost:8080/v1",
    requiresKey: false,
    keyHint: "optional",
    docsUrl: "",
    defaultModel: "custom-model",
    models: ["custom-model"],
    apiStyle: "openai",
    baseUrlEditable: true,
    accent: "#94a3b8",
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS[id] ?? PROVIDERS.zai;
}
