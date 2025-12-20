import { getApiKey } from "@/lib/api-key";

export const DEFAULT_API_URL = "http://localhost:2024";
export const DEFAULT_ASSISTANT_ID = "agent";

const ASSISTANT_OPTION_DEFINITIONS = [
  {
    id: "default",
    label: "默认助手",
  },
  {
    id: "knowledge",
    label: "知识库助手",
  },
  {
    id: "training",
    label: "培训助手",
  },
  {
    id: "finance",
    label: "财务分析助手",
  },
] as const;

export type AssistantOptionId =
  (typeof ASSISTANT_OPTION_DEFINITIONS)[number]["id"];

export type AssistantOption = {
  id: AssistantOptionId;
  label: string;
  assistantId: string;
};

export function resolveApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

export function resolveAssistantId(): string {
  return process.env.NEXT_PUBLIC_ASSISTANT_ID || DEFAULT_ASSISTANT_ID;
}

const ASSISTANT_ENV_OVERRIDES: Record<AssistantOptionId, string | undefined> = {
  default: process.env.NEXT_PUBLIC_ASSISTANT_ID_DEFAULT,
  knowledge: process.env.NEXT_PUBLIC_ASSISTANT_ID_KNOWLEDGE,
  training: process.env.NEXT_PUBLIC_ASSISTANT_ID_TRAINING,
  finance: process.env.NEXT_PUBLIC_ASSISTANT_ID_FINANCE,
};

const resolveAssistantEnvValue = (
  value: string | undefined,
  fallback: string,
) => {
  return value && value.trim().length > 0 ? value : fallback;
};

export function resolveAssistantOptions(): AssistantOption[] {
  const fallback = resolveAssistantId();
  return ASSISTANT_OPTION_DEFINITIONS.map((option) => ({
    id: option.id,
    label: option.label,
    assistantId: resolveAssistantEnvValue(
      ASSISTANT_ENV_OVERRIDES[option.id],
      fallback,
    ),
  }));
}

export function resolveApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || getApiKey() || "";
}
