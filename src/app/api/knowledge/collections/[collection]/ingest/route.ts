import { NextResponse } from "next/server";

import { MineruClient } from "@/lib/mineru";
import { publishKnowledgeMessage } from "@/lib/rabbitmq";

export const runtime = "nodejs";

const DEFAULT_MAX_BYTES = 30 * 1024 * 1024;

type Params = {
  params: Promise<{
    collection: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const collectionName = await getCollectionName(params);
    if (!collectionName) {
      return NextResponse.json({ error: "缺少知识库名称" }, { status: 400 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }
    const upload = file as File;
    const filename = upload.name || "document";
    const size = upload.size ?? 0;
    const maxBytes = getMaxUploadBytes();
    if (size > maxBytes) {
      return NextResponse.json(
        { error: `文件过大，最大支持 ${(maxBytes / (1024 * 1024)).toFixed(1)} MB` },
        { status: 413 },
      );
    }
    const description = readOptionalText(formData.get("description"));
    const source = readOptionalText(formData.get("source"));
    const buffer = Buffer.from(await upload.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: "文件内容为空" }, { status: 400 });
    }

    const mineru = new MineruClient();
    const result = await mineru.extractMarkdown({
      buffer,
      filename,
      mimetype: upload.type,
      size,
      description,
      source,
    });

    await publishKnowledgeMessage({
      collection: collectionName,
      filename,
      mineruTaskId: result.taskId,
      markdown: result.markdown,
      metadata: {
        uploadedAt: new Date().toISOString(),
        fileSize: size,
        source,
        description,
        mineruFiles: result.files,
      },
    });

    return NextResponse.json(
      {
        data: {
          taskId: result.taskId,
          bytes: size,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown, status = 500) {
  console.error(error);
  const message = error instanceof Error ? error.message : "上传失败，请稍后再试";
  return NextResponse.json({ error: message }, { status });
}

async function getCollectionName(params: Params["params"]) {
  const { collection } = await params;
  return decodeURIComponent(collection);
}

function readOptionalText(value: FormDataEntryValue | null) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  return undefined;
}

function getMaxUploadBytes() {
  const raw = process.env.KNOWLEDGE_UPLOAD_MAX_BYTES;
  if (!raw) {
    return DEFAULT_MAX_BYTES;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("KNOWLEDGE_UPLOAD_MAX_BYTES 必须为正数");
  }
  return value;
}
