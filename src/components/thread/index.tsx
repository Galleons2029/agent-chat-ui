import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  Bot,
  Check,
  ChevronDown,
  Database,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  SquarePen,
  XIcon,
  Plus,
} from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";

type ThreadProps = {
  className?: string;
  allowUploads?: boolean;
  agentOptions?: Array<{ id: string; label: string }>;
  selectedAgentId?: string;
  agentDefaultId?: string;
  onSelectAgent?: (id: string) => void;
  knowledgeOptions?: Array<{ id: string; label: string; description?: string }>;
  selectedKnowledgeIds?: string[];
  onKnowledgeChange?: (ids: string[]) => void;
  knowledgeLoading?: boolean;
  kgOverride?: string[];
};

const HISTORY_PANEL_WIDTH = 320;

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>滚动到底部</span>
    </Button>
  );
}

export function Thread({
  className,
  allowUploads = true,
  agentOptions,
  selectedAgentId,
  agentDefaultId,
  onSelectAgent,
  knowledgeOptions,
  selectedKnowledgeIds,
  onKnowledgeChange,
  knowledgeLoading = false,
  kgOverride,
}: ThreadProps = {}) {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [enableWebSearch, setEnableWebSearch] = useQueryState(
    "enableWebSearch",
    parseAsBoolean.withDefault(false),
  );
  const [input, setInput] = useState("");
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [knowledgeMenuOpen, setKnowledgeMenuOpen] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement | null>(null);
  const knowledgeMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks: _resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload({ enabled: allowUploads });
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const showAgentSelector =
    Boolean(agentOptions?.length) && typeof onSelectAgent === "function";
  const showKnowledgeSelector =
    Boolean(knowledgeOptions) &&
    typeof onKnowledgeChange === "function" &&
    Array.isArray(selectedKnowledgeIds);
  const selectedAgent = useMemo(
    () =>
      agentOptions?.find((option) => option.id === selectedAgentId) ??
      agentOptions?.[0],
    [agentOptions, selectedAgentId],
  );
  const selectedAgentLabel = selectedAgent?.label ?? "选择助手";
  const showClearAgent =
    showAgentSelector &&
    agentDefaultId &&
    selectedAgentId &&
    agentDefaultId !== selectedAgentId;
  const knowledgeSelectionLabel = useMemo(() => {
    if (!showKnowledgeSelector || !selectedKnowledgeIds) {
      return "选择知识库";
    }
    return selectedKnowledgeIds.length > 0
      ? `已选 ${selectedKnowledgeIds.length} 个知识库`
      : "选择知识库";
  }, [selectedKnowledgeIds, showKnowledgeSelector]);

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  const setThreadId = (id: string | null) => {
    _setThreadId(id);

    // close artifact and reset artifact context
    closeArtifact();
    setArtifactContext({});
  };

  useEffect(() => {
    if (!allowUploads && contentBlocks.length > 0) {
      setContentBlocks([]);
    }
  }, [allowUploads, contentBlocks.length, setContentBlocks]);

  useEffect(() => {
    if (!showAgentSelector) {
      setAgentMenuOpen(false);
    }
  }, [showAgentSelector]);

  useEffect(() => {
    if (!showKnowledgeSelector) {
      setKnowledgeMenuOpen(false);
    }
  }, [showKnowledgeSelector]);

  useEffect(() => {
    if (!agentMenuOpen && !knowledgeMenuOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (agentMenuRef.current?.contains(target)) {
        return;
      }
      if (knowledgeMenuRef.current?.contains(target)) {
        return;
      }
      setAgentMenuOpen(false);
      setKnowledgeMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAgentMenuOpen(false);
        setKnowledgeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [agentMenuOpen, knowledgeMenuOpen]);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("发生错误，请稍后重试。", {
        description: (
          <p>
            <strong>错误详情：</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const hasAttachments = allowUploads && contentBlocks.length > 0;
    if ((input.trim().length === 0 && !hasAttachments) || isLoading)
      return;
    setFirstTokenReceived(false);

    const attachmentBlocks = allowUploads ? contentBlocks : [];
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...attachmentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 || enableWebSearch
        ? {
            ...artifactContext,
            webSearchEnabled: enableWebSearch ?? false,
          }
        : undefined;

    const resolvedKg =
      kgOverride !== undefined
        ? kgOverride
        : Array.isArray(stream.values.kg)
          ? stream.values.kg
          : undefined;
    const agentStateUpdate = {
      ...(typeof stream.values.llm_calls === "number"
        ? { llm_calls: stream.values.llm_calls }
        : {}),
      ...(resolvedKg !== undefined ? { kg: resolvedKg } : {}),
      ...(stream.values.user_name ? { user_name: stream.values.user_name } : {}),
    };
    const stateUpdate = {
      ...agentStateUpdate,
      ...(context ? { context } : {}),
    };

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], ...stateUpdate },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          ...stateUpdate,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
    setContentBlocks([]);
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const handleAgentSelect = (id: string) => {
    onSelectAgent?.(id);
    setAgentMenuOpen(false);
  };
  const handleClearAgent = () => {
    if (!agentDefaultId) return;
    onSelectAgent?.(agentDefaultId);
    setAgentMenuOpen(false);
  };
  const handleToggleKnowledge = (id: string) => {
    if (!onKnowledgeChange || !selectedKnowledgeIds) {
      return;
    }
    if (selectedKnowledgeIds.includes(id)) {
      onKnowledgeChange(selectedKnowledgeIds.filter((item) => item !== id));
      return;
    }
    onKnowledgeChange([...selectedKnowledgeIds, id]);
  };

  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-gray-50", className)}>
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-visible"
          style={{ width: HISTORY_PANEL_WIDTH }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -HISTORY_PANEL_WIDTH }
              : { x: chatHistoryOpen ? 0 : -HISTORY_PANEL_WIDTH }
          }
          initial={{ x: -HISTORY_PANEL_WIDTH }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div className="relative h-full w-full">
            <ThreadHistory />
          </div>
        </motion.div>
      </div>

      <div
        className={cn(
          "grid w-full grid-cols-[1fr_0fr] transition-all duration-500",
          artifactOpen && "grid-cols-[3fr_2fr]",
        )}
      >
        <motion.div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden",
            !chatStarted && "grid-rows-[1fr]",
          )}
          layout={isLargeScreen}
          animate={{
            marginLeft: chatHistoryOpen
              ? isLargeScreen
                ? HISTORY_PANEL_WIDTH
                : 0
              : 0,
            width: chatHistoryOpen
              ? isLargeScreen
                ? `calc(100% - ${HISTORY_PANEL_WIDTH}px)`
                : "100%"
              : "100%",
          }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          {!chatStarted && (
            <div className="absolute top-0 left-0 z-10 flex w-full items-center gap-3 p-2 pl-4 justify-start">
              <div>
                {(!chatHistoryOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-gray-100"
                    variant="ghost"
                    onClick={() => setChatHistoryOpen((p) => !p)}
                  >
                    {chatHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          {chatStarted && (
            <div className="relative z-10 flex items-center justify-between gap-3 p-2">
              <div className="relative flex items-center justify-start gap-2">
                <div className="absolute left-0 z-10">
                  {(!chatHistoryOpen || !isLargeScreen) && (
                    <Button
                      className="hover:bg-gray-100"
                      variant="ghost"
                      onClick={() => setChatHistoryOpen((p) => !p)}
                    >
                      {chatHistoryOpen ? (
                        <PanelRightOpen className="size-5" />
                      ) : (
                        <PanelRightClose className="size-5" />
                      )}
                    </Button>
                  )}
                </div>
                <motion.button
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => setThreadId(null)}
                  animate={{
                    marginLeft: !chatHistoryOpen ? 48 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <img
                    src="/logo.svg"
                    alt="Logo"
                    width={32}
                    height={32}
                  />
                  <span className="text-xl font-semibold tracking-tight">
                    苏州银行助手
                  </span>
                </motion.button>
              </div>

              <div className="flex items-center gap-4">
                <TooltipIconButton
                  size="lg"
                  className="p-4"
                  tooltip="新建会话"
                  variant="ghost"
                  onClick={() => setThreadId(null)}
                >
                  <SquarePen className="size-5" />
                </TooltipIconButton>
              </div>

              <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
            </div>
          )}

          <StickToBottom className="relative flex-1 overflow-hidden bg-gray-50">
            <StickyToBottomContent
              className={cn(
                "absolute inset-0 overflow-y-scroll px-4 bg-gray-50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                !chatStarted && "mt-[25vh] flex flex-col items-stretch",
                chatStarted && "grid grid-rows-[1fr_auto]",
              )}
              contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full bg-gray-50"
              content={
                <>
                  {messages
                    .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                    .map((message, index) =>
                      message.type === "human" ? (
                        <HumanMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                        />
                      ) : (
                        <AssistantMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                          handleRegenerate={handleRegenerate}
                        />
                      ),
                    )}
                  {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                  {hasNoAIOrToolMessages && !!stream.interrupt && (
                    <AssistantMessage
                      key="interrupt-msg"
                      message={undefined}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                    />
                  )}
                  {isLoading && !firstTokenReceived && (
                    <AssistantMessageLoading />
                  )}
                </>
              }
              footer={
                <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-gray-50">
                  {!chatStarted && (
                    <div className="flex items-center gap-3">
                      <img src="/logo.svg" alt="Logo" className="h-8 flex-shrink-0" />
                      <h1 className="text-2xl font-semibold tracking-tight">
                        苏州银行助手
                      </h1>
                    </div>
                  )}

                  <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  {(showAgentSelector || showKnowledgeSelector) && (
                    <div className="mx-auto -mb-4 flex w-full max-w-3xl flex-wrap items-center gap-3 px-3">
                      {showAgentSelector && (
                        <div
                          ref={agentMenuRef}
                          className="relative flex items-center gap-2"
                        >
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={agentMenuOpen}
                            onClick={() => {
                              setAgentMenuOpen((prev) => !prev);
                              setKnowledgeMenuOpen(false);
                            }}
                            className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-1.5 text-sm text-gray-700 shadow-xs transition hover:bg-emerald-50"
                          >
                            <Bot className="h-4 w-4 text-emerald-600" />
                            <span>{selectedAgentLabel}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>
                          {showClearAgent && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleClearAgent();
                              }}
                              className="flex items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {agentMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                选择助手
                              </p>
                              <div className="space-y-1">
                                {agentOptions?.map((option) => {
                                  const selected =
                                    option.id === selectedAgentId;
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() =>
                                        handleAgentSelect(option.id)
                                      }
                                      className={cn(
                                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                                        selected
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "text-gray-700 hover:bg-gray-50",
                                      )}
                                    >
                                      <span>{option.label}</span>
                                      {selected && (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {showKnowledgeSelector && (
                        <div ref={knowledgeMenuRef} className="relative">
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={knowledgeMenuOpen}
                            onClick={() => {
                              setKnowledgeMenuOpen((prev) => !prev);
                              setAgentMenuOpen(false);
                            }}
                            className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-1.5 text-sm text-gray-700 shadow-xs transition hover:bg-emerald-50"
                          >
                            <Database className="h-4 w-4 text-emerald-600" />
                            <span>{knowledgeSelectionLabel}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>
                          {knowledgeMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                选择知识库
                              </p>
                              {knowledgeLoading ? (
                                <div className="px-2 py-4 text-sm text-gray-500">
                                  正在加载知识库...
                                </div>
                              ) : knowledgeOptions?.length ? (
                                <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                                  {knowledgeOptions.map((option) => {
                                    const selected =
                                      selectedKnowledgeIds?.includes(
                                        option.id,
                                      );
                                    return (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() =>
                                          handleToggleKnowledge(option.id)
                                        }
                                        className={cn(
                                          "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                                          selected
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "text-gray-700 hover:bg-gray-50",
                                        )}
                                      >
                                        <span className="flex flex-col gap-1">
                                          <span className="font-medium">
                                            {option.label}
                                          </span>
                                          {option.description ? (
                                            <span className="text-xs text-gray-400">
                                              {option.description}
                                            </span>
                                          ) : null}
                                        </span>
                                        <span
                                          className={cn(
                                            "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border",
                                            selected
                                              ? "border-emerald-500 bg-emerald-500 text-white"
                                              : "border-gray-200 text-transparent",
                                          )}
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="px-2 py-4 text-sm text-gray-500">
                                  暂无知识库，请先在知识库模块中创建。
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    ref={dropRef}
                    className={cn(
                      "bg-white relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl shadow-xs transition-all",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border border-solid",
                    )}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                    >
                      <ContentBlocksPreview
                        blocks={allowUploads ? contentBlocks : []}
                        onRemove={removeBlock}
                      />
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={allowUploads ? handlePaste : undefined}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.metaKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            const el = e.target as HTMLElement | undefined;
                            const form = el?.closest("form");
                            form?.requestSubmit();
                          }
                        }}
                        placeholder="请输入你的问题..."
                        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-6 p-2 pt-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="enable-web-search"
                              checked={enableWebSearch ?? false}
                              onCheckedChange={setEnableWebSearch}
                            />
                            <Label
                              htmlFor="enable-web-search"
                              className="text-sm text-gray-600"
                            >
                              联网搜索
                            </Label>
                          </div>
                        </div>
                        {allowUploads && (
                          <>
                            <Label
                              htmlFor="file-input"
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Plus className="size-5 text-gray-600" />
                              <span className="text-sm text-gray-600">
                                上传 PDF 或图片
                              </span>
                            </Label>
                            <input
                              id="file-input"
                              type="file"
                              onChange={handleFileUpload}
                              multiple
                              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                              className="hidden"
                            />
                          </>
                        )}
                        {stream.isLoading ? (
                          <Button
                            key="stop"
                            onClick={() => stream.stop()}
                            className="ml-auto"
                          >
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            取消
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="ml-auto shadow-md transition-all"
                            disabled={
                              isLoading ||
                              (!input.trim() &&
                                (!allowUploads || contentBlocks.length === 0))
                            }
                          >
                            发送
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              }
            />
          </StickToBottom>
        </motion.div>
        <div className="relative flex flex-col border-l">
          <div className="absolute inset-0 flex min-w-[30vw] flex-col">
            <div className="grid grid-cols-[1fr_auto] border-b p-4">
              <ArtifactTitle className="truncate overflow-hidden" />
              <button
                onClick={closeArtifact}
                className="cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <ArtifactContent className="relative flex-grow" />
          </div>
        </div>
      </div>
    </div>
  );
}
