#!/usr/bin/env node
/**
 * TypeScript helper to send a message to your LangGraph backend
 * and print streamed responses to stdout.
 *
 * Usage:
 *   pnpm dlx ts-node --esm scripts/langgraph-stream.ts
 *
 * Env vars: NEXT_PUBLIC_API_URL/API_URL, NEXT_PUBLIC_ASSISTANT_ID/ASSISTANT_ID,
 * NEXT_PUBLIC_API_KEY/API_KEY/LANGCHAIN_API_KEY, THREAD_ID.
 */
import "dotenv/config";
import { Client, type Message, type StreamMode } from "@langchain/langgraph-sdk";

const apiUrl =
  // process.env.NEXT_PUBLIC_API_URL ||
  // process.env.API_URL ||
  "http://localhost:2025";
const assistantId =
  // process.env.NEXT_PUBLIC_ASSISTANT_ID ||
  // process.env.ASSISTANT_ID ||
  "rag_agent";
const apiKey =
  process.env.NEXT_PUBLIC_API_KEY ||
  process.env.API_KEY ||
  process.env.LANGCHAIN_API_KEY;

// ---- Hard-coded payload ----
const USER_MESSAGE = "你好，LangGraph！这是一次测试请求。";
const CONTEXT: Record<string, unknown> | undefined = {
  foo: "bar",
  runMode: "demo",
};
const USER_ID = "武大郎";
// ----------------------------

async function main() {
  if (!apiUrl || !assistantId) {
    console.error("缺少 API_URL 或 ASSISTANT_ID。请设置环境变量后重试。");
    process.exit(1);
  }

  const client = new Client({ apiUrl, apiKey });
  const threadId =
    process.env.THREAD_ID || (await client.threads.create()).thread_id;

  console.log(
    `[info] Using assistant=${assistantId} apiUrl=${apiUrl} threadId=${threadId}`,
  );
  console.log(`[info] Sending message: ${USER_MESSAGE}`);
  if (CONTEXT) {
    console.log(`[info] With context: ${JSON.stringify(CONTEXT)}`);
  }

  const messages: Message[] = [
    {
      type: "human",
      content: [{ type: "text", text: USER_MESSAGE }],
    },
  ];

  const streamModes: StreamMode[] = ["messages", "values", "events", "updates"];

  const stream = client.runs.stream(threadId, assistantId, {
    input: { messages },
    streamMode: streamModes,
    streamSubgraphs: true,
    streamResumable: true,
    ...(CONTEXT ? { context: CONTEXT } : {}),
  });

  for await (const event of stream) {
    const label = event.id ? `${event.event}#${event.id}` : event.event;
    console.log(`\n[${label}]`);
    // Keep depth reasonable to avoid truncating nested tool outputs.
    console.dir(event.data, { depth: 8 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


// use pnpm dlx ts-node --esm scripts/langgraph-stream.ts to run this script
// Make sure to set the necessary environment variables before running
// such as API_URL, ASSISTANT_ID, API_KEY, THREAD_ID (optional)
