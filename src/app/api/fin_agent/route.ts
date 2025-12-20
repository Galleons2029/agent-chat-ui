import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";

// Proxy to LangGraph fin_agent for single-record analysis.
const rawApiUrl =
  process.env.LANGGRAPH_API_URL ||
  process.env.LANGGRAPH_FAST_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:2024";
const apiUrl = rawApiUrl.replace("localhost", "127.0.0.1").replace("[::1]", "127.0.0.1");
const apiKey = process.env.LANGSMITH_API_KEY || process.env.LANGGRAPH_API_KEY || "";
const assistantId =
  process.env.LANGGRAPH_FIN_AGENT_ID ||
  process.env.NEXT_PUBLIC_FIN_AGENT_ID ||
  "fin_agent";

function extractJsonFromText(text: string): any | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  if (!candidate) return null;
  if (!/^[\[{]/.test(candidate)) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function extractJsonFromMessages(runResult: any): any | null {
  const messageSets = [
    runResult?.messages,
    runResult?.output?.messages,
    runResult?.values?.messages,
  ].filter(Boolean);

  for (const messages of messageSets) {
    if (!Array.isArray(messages)) continue;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const content = messages[i]?.content;
      if (!content) continue;
      if (typeof content === "object" && !Array.isArray(content)) return content;
      let text = "";
      if (typeof content === "string") {
        text = content;
      } else if (Array.isArray(content)) {
        text = content.map((item) => (typeof item === "string" ? item : item?.text ?? "")).join("\n");
      }
      const parsed = text ? extractJsonFromText(text) : null;
      if (parsed) return parsed;
    }
  }
  return null;
}

function findObjectWithResults(value: unknown, depth = 0): any | null {
  if (depth > 4 || value == null) return null;
  if (typeof value === "object") {
    if (!Array.isArray(value) && "results" in (value as any)) return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findObjectWithResults(item, depth + 1);
        if (found) return found;
      }
    } else {
      for (const v of Object.values(value)) {
        const found = findObjectWithResults(v, depth + 1);
        if (found) return found;
      }
    }
  }
  return null;
}

function normalizeOutput(runResult: any) {
  const candidates = [
    runResult?.values,
    runResult?.output,
    runResult,
  ].filter(Boolean);

  const deepFound = findObjectWithResults(runResult);
  if (deepFound) return deepFound;

  const fromMessages = extractJsonFromMessages(runResult);
  if (fromMessages) return fromMessages;

  // Prefer 对象直接?results
  for (const c of candidates) {
    if (c && typeof c === "object" && !Array.isArray(c) && "results" in c) {
      return c;
    }
  }

  // 兼容返回数组的情况，取首个包?results 的项
  for (const c of candidates) {
    if (Array.isArray(c)) {
      const found = c.find((item) => item && typeof item === "object" && "results" in item);
      if (found) return found;
      // 没找到就退回第一?      if (c.length) return c[0];
    }
  }

  return candidates[0] ?? {};
}

function buildAgentInput(
  org: string,
  sbj: string,
  ccy: string,
  dt: string,
  planPrompt?: string,
  selectedSteps?: string[],
  mode?: string,
  sqlRequest?: string,
) {
  const isSql = mode === "sql" || Boolean(sqlRequest);
  const toolArgs: Record<string, any> = {
    org_num: org,
    sbj_num: sbj,
    ccy,
    dt,
  };
  if (planPrompt) toolArgs.plan_prompt = planPrompt;
  if (selectedSteps?.length) toolArgs.user_selected_steps = selectedSteps;
  if (isSql) toolArgs.sql_request = sqlRequest;

  const userMessage = isSql
    ? [
        "Generate SQL for the request and return JSON only.",
        "Parameters:",
        JSON.stringify({ sql_request: sqlRequest }),
      ].join("\n")
    : [
        "Call analyze_react_bank and return JSON only.",
        "Parameters:",
        JSON.stringify(toolArgs),
      ].join("\n");

  return {
    target_org: org,
    target_sbj: sbj,
    target_ccy: ccy,
    target_dt: dt,
    plan_prompt: planPrompt,
    user_selected_steps: selectedSteps,
    mode,
    sql_request: sqlRequest,
    messages: [
      {
        type: "human",
        content: userMessage,
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  const { org, sbj, ccy, dt, planPrompt, selectedSteps, mode, sqlRequest } = await req.json().catch(() => ({}));
  if (mode !== "sql" && (!org || !sbj || !ccy || !dt)) {
    return NextResponse.json({ error: "参数缺失：org/sbj/ccy/dt 必填" }, { status: 400 });
  }

  try {
    const client = new Client({ apiUrl, apiKey: apiKey || undefined });
    const runResult = await client.runs.wait(null, assistantId, {
      input: buildAgentInput(org || "", sbj || "", ccy || "", dt || "", planPrompt, selectedSteps, mode, sqlRequest),
    });

    if (runResult && typeof runResult === "object" && "__error__" in runResult) {
      console.error("fin_agent returned __error__", runResult);
      return NextResponse.json({ error: (runResult as any).__error__, raw: runResult }, { status: 500 });
    }

    const output = normalizeOutput(runResult);
    const isSqlMode = mode === "sql" || Boolean((output as any)?.sql_query);
    if (!isSqlMode && Array.isArray((output as any)?.results) && (output as any).results.length === 0) {
      return NextResponse.json(
        {
          error: "未在数据库中找到匹配的总分不平记录，请检查 org/sbj/ccy/dt 或 tot 表数据。",
          raw: runResult,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ output, raw: runResult });
  } catch (err: any) {
    console.error("fin_agent error", err);
    return NextResponse.json({ error: err?.message || "调用 fin_agent 失败" }, { status: 500 });
  }
}

