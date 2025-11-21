import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";

import { getContentString } from "../utils";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose, Trash2, MessageSquare } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { deleteThread } = useThreads();

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-start justify-start gap-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        const isActive = threadId === t.thread_id;

        return (
          <div
            key={t.thread_id}
            className="group relative w-full px-2 py-1"
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-xl px-3 py-6 text-left font-normal transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-200"
                  : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm",
              )}
              onClick={(e) => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (t.thread_id === threadId) return;
                setThreadId(t.thread_id);
              }}
            >
              <div className="flex w-full items-center gap-3 overflow-hidden">
                <MessageSquare
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                <p className="truncate text-sm">{itemText}</p>
              </div>
            </Button>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (confirm("确定要删除这条对话吗？")) {
                    await deleteThread(t.thread_id);
                    if (isActive) {
                      setThreadId(null);
                    }
                  }
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col items-start justify-start gap-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-10 w-full rounded-2xl"
        />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  return (
    <>
      <aside className="group/sidebar relative hidden h-full min-h-0 w-[280px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-50/50 transition-all duration-300 ease-in-out lg:flex">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              历史记录
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              onClick={() => setChatHistoryOpen((p) => !p)}
            >
              {chatHistoryOpen ? (
                <PanelRightOpen className="size-4" />
              ) : (
                <PanelRightClose className="size-4" />
              )}
            </Button>
          </div>

          <div className="flex-1 min-h-0 px-2 pb-4">
            {threadsLoading ? (
              <ThreadHistoryLoading />
            ) : (
              <ThreadList threads={threads} />
            )}
          </div>
        </div>
      </aside>
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent
            side="left"
            className="flex lg:hidden"
          >
            <SheetHeader>
              <SheetTitle>对话历史</SheetTitle>
            </SheetHeader>
            <ThreadList
              threads={threads}
              onThreadClick={() => setChatHistoryOpen((o) => !o)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
