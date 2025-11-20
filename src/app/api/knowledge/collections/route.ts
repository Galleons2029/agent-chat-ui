import { NextResponse } from "next/server";

import {
  createKnowledgeBase,
  listKnowledgeBases,
} from "@/app/api/knowledge/service";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await listKnowledgeBases(user.id);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const displayName = String(body.displayName ?? name).trim();
    const description =
      typeof body.description === "string" ? body.description : undefined;
    const vectorSize = Number(body.vectorSize ?? 1536);
    const allowedDistances = ["Cosine", "Dot", "Euclid"] as const;
    const distanceCandidate = String(body.distance ?? "Cosine");
    const distance = allowedDistances.includes(
      distanceCandidate as (typeof allowedDistances)[number],
    )
      ? distanceCandidate
      : "Cosine";
    const type = body.type === "enterprise" ? "enterprise" : "personal";

    if (!name) {
      return NextResponse.json(
        { error: "知识库名称不能为空" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(vectorSize) || vectorSize <= 0) {
      return NextResponse.json(
        { error: "向量维度必须为正数" },
        { status: 400 },
      );
    }

    const data = await createKnowledgeBase({
      name,
      displayName,
      description,
      vectorSize,
      distance,
      type,
      ownerId: user.id,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown, status = 500) {
  console.error(error);
  const message =
    error instanceof Error ? error.message : "未知错误，请稍后再试";
  return NextResponse.json({ error: message }, { status });
}
