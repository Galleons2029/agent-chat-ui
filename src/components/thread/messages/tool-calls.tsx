import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Terminal, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JsonRenderer } from "./json-renderer";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
  isLoading,
}: {
  toolCalls: AIMessage["tool_calls"];
  isLoading?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isLoading]);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;

        return (
          <div
            key={idx}
            className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm"
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-between bg-emerald-50/30 px-4 py-3 transition-colors hover:bg-emerald-50/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Terminal className="size-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">
                    调用工具: {tc.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {isLoading ? "正在执行..." : "执行完成"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-emerald-500" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                )}
                {isExpanded ? (
                  <ChevronUp className="size-4 text-gray-400" />
                ) : (
                  <ChevronDown className="size-4 text-gray-400" />
                )}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-emerald-100/50 bg-gray-50/50 p-4">
                    {hasArgs ? (
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <JsonRenderer data={args} />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">无参数</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({
  message,
  isLoading
}: {
  message: ToolMessage;
  isLoading?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isLoading]);

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between bg-blue-50/30 px-4 py-3 transition-colors hover:bg-blue-50/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Terminal className="size-4" />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  工具返回结果
                </span>
                {message.name && (
                  <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                    {message.name}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {isLoading ? "正在接收..." : "接收完成"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="size-4 text-gray-400" />
            ) : (
              <ChevronDown className="size-4 text-gray-400" />
            )}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="border-t border-blue-100/50 bg-gray-50/50 p-4">
                <div className="rounded-lg border border-gray-200 bg-white p-3 overflow-x-auto">
                  {isJsonContent ? (
                    <JsonRenderer data={parsedContent} />
                  ) : (
                    <pre className="whitespace-pre-wrap break-all font-mono text-xs text-gray-600">
                      {contentStr}
                    </pre>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
