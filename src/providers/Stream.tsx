import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  isUIMessage,
  isRemoveUIMessage,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import {
  resolveApiKey,
  resolveApiUrl,
  resolveAssistantId,
} from "@/lib/langgraph-config";
import { useThreads } from "./Thread";
import { toast } from "sonner";

export type StateType = {
  messages: Message[];
  llm_calls?: number;
  kg?: string[];
  user_name?: string;
  user_id?: string;
  ui?: UIMessage[];
  context?: Record<string, unknown>;
};

type StreamUpdateType = {
  messages?: Message[] | Message | string;
  llm_calls?: number;
  kg?: string[];
  user_name?: string;
  user_id?: string;
  ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
  context?: Record<string, unknown>;
};

type UserIdentity = {
  user_name: string;
  user_id: string;
};

const USER_PROFILE_STORAGE_KEY = "bankcopilot:profile";
const USER_ID_STORAGE_KEY = "bankcopilot:user_id";
const DEFAULT_USER_NAME = "guest";
const DEFAULT_USER_ID = "user_default";

const readLocalStorage = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const getStoredUserName = (): string | null => {
  const raw = readLocalStorage(USER_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as {
      displayName?: string;
      handle?: string;
      name?: string;
    };
    const candidate =
      parsed.displayName?.trim() ||
      parsed.handle?.trim() ||
      parsed.name?.trim();
    return candidate || null;
  } catch {
    return null;
  }
};

const createUserId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `user_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
};

const resolveUserId = () => {
  const stored = readLocalStorage(USER_ID_STORAGE_KEY);
  if (stored && stored.trim().length > 0) {
    return stored.trim();
  }
  if (typeof window === "undefined") {
    return DEFAULT_USER_ID;
  }
  const created = createUserId();
  try {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, created);
  } catch {
    // Ignore storage failures (private mode, storage full, etc.).
  }
  return created;
};

export const resolveUserIdentity = (
  overrides?: Partial<UserIdentity>,
): UserIdentity => {
  const user_name =
    getStoredUserName() ||
    overrides?.user_name?.trim() ||
    DEFAULT_USER_NAME;
  const user_id = resolveUserId() || overrides?.user_id?.trim() || DEFAULT_USER_ID;
  return { user_name, user_id };
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: StreamUpdateType;
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

const normalizeMessageUpdate = (
  update: StreamUpdateType["messages"],
): Message[] => {
  if (!update) return [];
  if (typeof update === "string") {
    return [{ type: "human", content: update }];
  }
  return Array.isArray(update) ? update : [update];
};

const mergeMessages = (prev: Message[], next: Message[]): Message[] => {
  if (next.length === 0) return prev;
  const merged = prev.slice();
  const indexById = new Map<string, number>();
  merged.forEach((message, index) => {
    if (message.id) indexById.set(message.id, index);
  });

  next.forEach((message) => {
    const messageId = message.id;
    if (messageId && indexById.has(messageId)) {
      merged[indexById.get(messageId)!] = message;
      return;
    }
    merged.push(message);
    if (messageId) indexById.set(messageId, merged.length - 1);
  });

  return merged;
};

const stripUndefined = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>;

const applyStateUpdate = (
  prev: StateType,
  update: StreamUpdateType,
): StateType => {
  const { messages, ui, ...rest } = update;
  let next = { ...prev, ...stripUndefined(rest) };

  if (ui) {
    next = { ...next, ui: uiMessageReducer(prev.ui ?? [], ui) };
  }

  if (messages) {
    const incoming = normalizeMessageUpdate(messages);
    if (incoming.length > 0) {
      const merged = mergeMessages(prev.messages ?? [], incoming);
      next = { ...next, messages: merged };
    }
  }

  return next;
};

const applyUpdateEvent = (
  prev: StateType,
  updates: Record<string, StreamUpdateType>,
): StateType =>
  Object.values(updates).reduce<StateType>(
    (next, update) =>
      update && typeof update === "object" ? applyStateUpdate(next, update) : next,
    prev,
  );

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const SUPPRESS_AI_CHAT_INIT_TOAST =
  process.env.NEXT_PUBLIC_SUPPRESS_AI_CHAT_INIT_TOAST === "true";

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads, setThreads } = useThreads();
  const initialIdentity = useMemo(() => resolveUserIdentity(), []);
  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    initialValues: {
      messages: [],
      user_name: initialIdentity.user_name,
      user_id: initialIdentity.user_id,
    },
    fetchStateHistory: true,
    onUpdateEvent: (event, options) => {
      options.mutate((prev) => applyUpdateEvent(prev, event));
    },
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          const ui = uiMessageReducer(prev.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },
    onThreadId: (id) => {
      setThreadId(id);
      // Refetch threads list when thread ID changes.
      // Wait for some seconds before fetching so we're able to get the new thread that was created.
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  useEffect(() => {
    let isMounted = true;

    checkGraphStatus(apiUrl, apiKey).then((ok) => {
      if (!isMounted || ok) {
        return;
      }

      if (SUPPRESS_AI_CHAT_INIT_TOAST) {
        console.warn(
          "Failed to connect to LangGraph server but NEXT_PUBLIC_SUPPRESS_AI_CHAT_INIT_TOAST is enabled.",
        );
        return;
      }

      toast.error("Failed to connect to LangGraph server", {
        description: () => (
          <p>
            Please ensure your graph is running at <code>{apiUrl}</code> and
            your API key is correctly set (if connecting to a deployed graph).
          </p>
        ),
        duration: 10000,
        richColors: true,
        closeButton: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [apiKey, apiUrl]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{
  children: ReactNode;
  assistantId?: string;
}> = ({ children, assistantId: assistantIdProp }) => {
  const [apiKey] = useState(() => resolveApiKey());
  const apiUrl = resolveApiUrl();
  const assistantId = assistantIdProp ?? resolveAssistantId();

  return (
    <StreamSession
      apiKey={apiKey}
      apiUrl={apiUrl}
      assistantId={assistantId}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
