"use client";

import React from "react";
import { Thread } from "@/components/thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import { StreamProviderWithAssistant } from "@/providers/Stream";
import { ThreadProviderWithAssistant } from "@/providers/Thread";
import { resolveFinAssistantId } from "@/lib/langgraph-config";

export default function FinAgentPage(): React.ReactNode {
  const FIN_ASSISTANT_ID = resolveFinAssistantId();

  return (
    <React.Suspense fallback={<div>Loading (fin_agent)...</div>}>
      <Toaster />
      <ThreadProviderWithAssistant assistantId={FIN_ASSISTANT_ID}>
        <StreamProviderWithAssistant assistantId={FIN_ASSISTANT_ID}>
          <ArtifactProvider>
            <Thread />
          </ArtifactProvider>
        </StreamProviderWithAssistant>
      </ThreadProviderWithAssistant>
    </React.Suspense>
  );
}
