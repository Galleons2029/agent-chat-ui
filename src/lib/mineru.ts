import { setTimeout as delay } from "node:timers/promises";

type MineruApiResponse<T = unknown> = {
  code?: number;
  msg?: string;
  message?: string;
  data?: T;
  error?: string;
};

export type MineruFileDescriptor = {
  name?: string;
  file_name?: string;
  filename?: string;
  format?: string;
  type?: string;
  url?: string;
  download_url?: string;
  file_url?: string;
};

type MineruStatusPayload = {
  taskId?: string;
  task_id?: string;
  status?: string;
  state?: string;
  phase?: string;
  markdown?: string;
  md?: string;
  files?: MineruFileDescriptor[];
  fileList?: MineruFileDescriptor[];
  outputs?: MineruFileDescriptor[];
};

export type MineruExtractionResult = {
  taskId: string;
  markdown: string;
  files: string[];
  raw: MineruStatusPayload;
};

export type MineruUploadInput = {
  buffer: Buffer;
  filename: string;
  mimetype?: string;
  size?: number;
  description?: string;
  source?: string;
};

const DEFAULT_UPLOAD_PATH = "/extract/upload";
const DEFAULT_STATUS_PATH = "/extract/status";

export class MineruClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly uploadPath: string;
  private readonly statusPath: string;
  private readonly statusTaskKey: string;
  private readonly pollInterval: number;
  private readonly timeoutMs: number;
  private readonly outputFormat: string;
  private readonly extraFormFields: Record<string, string>;

  constructor() {
    this.baseUrl = readEnv("MINERU_API_BASE_URL");
    this.apiKey = readEnv("MINERU_API_KEY");
    this.uploadPath = process.env.MINERU_UPLOAD_PATH ?? DEFAULT_UPLOAD_PATH;
    this.statusPath = process.env.MINERU_STATUS_PATH ?? DEFAULT_STATUS_PATH;
    this.statusTaskKey = process.env.MINERU_STATUS_TASK_KEY ?? "task_id";
    this.pollInterval = parseNumberEnv(
      process.env.MINERU_POLL_INTERVAL_MS,
      3000,
      "MINERU_POLL_INTERVAL_MS",
    );
    this.timeoutMs = parseNumberEnv(
      process.env.MINERU_JOB_TIMEOUT_MS,
      120_000,
      "MINERU_JOB_TIMEOUT_MS",
    );
    this.outputFormat = process.env.MINERU_OUTPUT_FORMAT ?? "markdown";
    this.extraFormFields = parseJsonEnv(
      process.env.MINERU_UPLOAD_EXTRA_FIELDS,
    );
  }

  async extractMarkdown(input: MineruUploadInput): Promise<MineruExtractionResult> {
    const taskId = await this.upload(input);
    const payload = await this.pollUntilFinished(taskId);
    const markdown = await this.resolveMarkdown(payload);
    return {
      taskId,
      markdown,
      files: extractFileNames(payload),
      raw: payload,
    };
  }

  private async upload(input: MineruUploadInput): Promise<string> {
    const url = this.buildUrl(this.uploadPath);
    const form = new FormData();
    const blob = new Blob([input.buffer], {
      type: input.mimetype ?? "application/octet-stream",
    });
    form.append("file", blob, input.filename);
    form.append("export_type", this.outputFormat);
    if (input.description) {
      form.append("description", input.description);
    }
    if (input.source) {
      form.append("source", input.source);
    }
    Object.entries(this.extraFormFields).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(),
      body: form,
    });
    const payload = (await safeJson(response)) as MineruApiResponse<{
      taskId?: string;
      task_id?: string;
    }>;
    validateResponse(response, payload);
    const taskId =
      payload?.data?.taskId ??
      payload?.data?.task_id ??
      (payload as unknown as MineruStatusPayload)?.taskId;
    if (!taskId) {
      throw new Error("MinerU 未返回任务 ID");
    }
    return taskId;
  }

  private async pollUntilFinished(taskId: string): Promise<MineruStatusPayload> {
    const url = new URL(this.buildUrl(this.statusPath));
    url.searchParams.set(this.statusTaskKey, taskId);
    const startedAt = Date.now();
    for (;;) {
      const response = await fetch(url, {
        method: "GET",
        headers: this.buildHeaders(),
      });
      const payload = (await safeJson(response)) as MineruApiResponse<MineruStatusPayload>;
      validateResponse(response, payload);
      const data = payload?.data ?? (payload as MineruStatusPayload);
      const status = normalizeStatus(data);
      if (status === "finished") {
        return data;
      }
      if (status === "failed") {
        const reason = payload?.msg ?? payload?.message ?? "MinerU 解析失败";
        throw new Error(reason);
      }
      if (Date.now() - startedAt > this.timeoutMs) {
        throw new Error("MinerU 解析超时，请稍后重试");
      }
      await delay(this.pollInterval);
    }
  }

  private async resolveMarkdown(payload: MineruStatusPayload): Promise<string> {
    const inlineMarkdown = payload.markdown ?? payload.md;
    if (inlineMarkdown) {
      return inlineMarkdown;
    }
    const files = normalizeFiles(payload);
    if (!files.length) {
      throw new Error("MinerU 未返回 Markdown 文件");
    }
    const results: string[] = [];
    // Fetch sequentially to avoid overwhelming MinerU API.
    for (const file of files) {
      const url = this.normalizeFileUrl(file);
      const response = await fetch(url, {
        method: "GET",
        headers: this.buildHeadersForDownload(url),
      });
      if (!response.ok) {
        const reason = await response.text();
        throw new Error(`下载 MinerU 文件失败：${reason || response.statusText}`);
      }
      results.push(await response.text());
    }
    return results.join("\n\n");
  }

  private normalizeFileUrl(file: MineruFileDescriptor): string {
    const candidate = file.url ?? file.download_url ?? file.file_url;
    if (!candidate) {
      throw new Error("MinerU 返回的文件缺少下载地址");
    }
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
      return candidate;
    }
    return this.buildUrl(candidate);
  }

  private buildHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private buildHeadersForDownload(url: string) {
    try {
      const target = new URL(url);
      const base = new URL(this.baseUrl);
      if (target.host === base.host) {
        return this.buildHeaders();
      }
    } catch {
      // ignore parse errors, fall back to no auth header
    }
    return {} as Record<string, string>;
  }

  private buildUrl(path: string) {
    if (!path) {
      return this.baseUrl;
    }
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    if (path.startsWith("/")) {
      return `${this.baseUrl}${path}`;
    }
    return `${this.baseUrl}/${path}`;
  }
}

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少 ${name} 环境变量，请参考 README 配置 MinerU API`);
  }
  return value.replace(/\/$/, "");
}

function parseNumberEnv(raw: string | undefined, fallback: number, name: string) {
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} 必须为正数`);
  }
  return value;
}

function parseJsonEnv(raw: string | undefined) {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value)]),
      );
    }
    throw new Error("必须为 JSON 对象");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`MINERU_UPLOAD_EXTRA_FIELDS 解析失败：${message}`);
  }
}

async function safeJson(response: Response) {
  const clone = response.clone();
  try {
    return await clone.json();
  } catch {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
}

function validateResponse(response: Response, payload: MineruApiResponse) {
  const code = payload?.code ?? 0;
  if (response.ok && (code === 0 || code === undefined)) {
    return;
  }
  const message =
    payload?.msg ??
    payload?.message ??
    payload?.error ??
    response.statusText ??
    "MinerU 请求失败";
  throw new Error(message);
}

function normalizeStatus(payload: MineruStatusPayload) {
  const value = (payload.status ?? payload.state ?? payload.phase ?? "").toLowerCase();
  if (["finished", "success", "succeeded", "done", "complete", "completed"].includes(value)) {
    return "finished";
  }
  if (["failed", "error", "timeout"].includes(value)) {
    return "failed";
  }
  return "running";
}

function normalizeFiles(payload: MineruStatusPayload) {
  const files =
    payload.files ??
    payload.fileList ??
    payload.outputs ??
    [];
  return files.filter(isMarkdownDescriptor);
}

function isMarkdownDescriptor(file: MineruFileDescriptor) {
  const name = (file.name ?? file.file_name ?? file.filename ?? "").toLowerCase();
  const type = (file.format ?? file.type ?? "").toLowerCase();
  if (name.endsWith(".md") || type.includes("markdown")) {
    return true;
  }
  return false;
}

function extractFileNames(payload: MineruStatusPayload) {
  return normalizeFiles(payload).map(
    (file) => file.name ?? file.file_name ?? file.filename ?? "markdown.md",
  );
}
