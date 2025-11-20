# Agent Chat UI

Agent Chat UI 是一个基于 Next.js 的应用，能通过聊天界面连接任何公开 `messages` 键的 LangGraph 服务器。

## 📊 自定义组件系统

本项目已集成 **前端自定义组件系统**，支持在聊天消息中动态渲染图表、表格等组件：

- ✅ **图表组件** - 基于 ECharts 的交互式图表渲染
- ✅ **表格组件** - 结构化数据表格展示
- ✅ **图片组件** - 图片预览和显示
- ✅ **文件组件** - 文件信息和下载
- ✅ **Mermaid 图表** - 流程图、序列图、甘特图等可视化图表

📖 **完整文档**: [docs/README.md](docs/README.md)

🚀 **快速开始**: [docs/quick-start.md](docs/quick-start.md)

🔷 **Mermaid 支持**: [docs/mermaid-integration.md](docs/mermaid-integration.md)

🧪 **测试页面**: http://localhost:3000/test-components

---

> [!NOTE]
> 🎥 可在此观看视频安装指南：[https://youtu.be/lInrwVnZ83o](https://youtu.be/lInrwVnZ83o)。

## 安装

> [!TIP]
> 不想在本地运行？直接使用已部署的网站：[agentchat.vercel.app](https://agentchat.vercel.app)！

首先克隆仓库，或运行 [`npx` 命令](https://www.npmjs.com/package/create-agent-chat-app)：

```bash
npx create-agent-chat-app
```

或者：

```bash
git clone https://github.com/langchain-ai/agent-chat-ui.git

cd agent-chat-ui
```

安装依赖：

```bash
pnpm install
```

启动应用：

```bash
pnpm dev
```

应用将运行在 `http://localhost:3000`。

### Docker Compose

也可以在容器中运行开发服务器，并通过 `3000` 端口对外暴露：

```bash
docker compose up --build
```

绑定挂载会保持容器与本地文件同步，因此主机端的修改会触发热重载。新增或删除依赖后请重新构建开发镜像，确保容器内的 `node_modules` 同步：

```bash
docker compose build frontend
```

## 使用说明

无论是在本地还是托管站点中启动应用，系统都会提示输入以下信息：

- **Deployment URL**：需要聊天的 LangGraph 服务器地址，可以是生产或开发环境。
- **Assistant/Graph ID**：在聊天界面获取及提交运行时使用的图名称或助手 ID。
- **LangSmith API Key**：仅在连接托管的 LangGraph 服务器时需要，用于请求鉴权。

填写完毕后点击 `Continue`，即可跳转到聊天界面，与 LangGraph 服务器开始对话。

## 环境变量

通过设置以下环境变量可以跳过初始化表单：

```bash
NEXT_PUBLIC_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent
```

> [!TIP]
> 若要连接生产环境的 LangGraph 服务器，请参考 [部署到生产环境](#going-to-production) 部分。

使用方式：

1. 将 `.env.example` 复制为 `.env`
2. 在 `.env` 中填写对应的值
3. 重启应用

当这些变量设置后，应用会直接使用它们而不再展示配置表单。

## 知识库文件上传（MinerU + RabbitMQ）

仪表盘「知识库」模块支持直接上传文件：系统会调用 [MinerU API](https://mineru.net/apiManage/docs) 将文件解析为 Markdown，然后把解析结果打包成 JSON 字符串推送到指定 RabbitMQ 队列，由后端消费写入 Qdrant。要启用该能力，请额外配置以下环境变量：

| 变量名 | 说明 |
| --- | --- |
| `MINERU_API_BASE_URL` | MinerU API 基础地址，例如 `https://mineru.net/apiManage` |
| `MINERU_API_KEY` | MinerU 控制台申请的 API Key，将作为 `Authorization: Bearer <key>` 发送 |
| `MINERU_UPLOAD_PATH` *(可选)* | 上传接口路径，默认 `/extract/upload` |
| `MINERU_STATUS_PATH` *(可选)* | 轮询任务状态的接口路径，默认 `/extract/status` |
| `MINERU_STATUS_TASK_KEY` *(可选)* | 轮询接口中表示任务 ID 的查询参数名，默认 `task_id` |
| `MINERU_OUTPUT_FORMAT` *(可选)* | MinerU 导出的目标格式，默认 `markdown` |
| `MINERU_UPLOAD_EXTRA_FIELDS` *(可选)* | 需要一并提交到 MinerU 的额外字段，JSON 对象格式 |
| `MINERU_POLL_INTERVAL_MS`/`MINERU_JOB_TIMEOUT_MS` *(可选)* | 轮询 MinerU 状态的间隔与超时时间（毫秒） |
| `RABBITMQ_URL` | AMQP 连接串，如 `amqp://user:pass@host:5672/vhost` |
| `RABBITMQ_KNOWLEDGE_QUEUE` | 用于承载解析结果的队列名称 |
| `KNOWLEDGE_UPLOAD_MAX_BYTES` *(可选)* | 单个上传文件的大小上限，默认 `30MB` |

队列中的消息为 JSON 字符串，结构如下：

```json
{
  "collection": "policy-v1",
  "filename": "员工手册.pdf",
  "mineruTaskId": "task_xxx",
  "markdown": "# MinerU 转换后的 Markdown ...",
  "metadata": {
    "uploadedAt": "2025-01-11T03:21:09.812Z",
    "fileSize": 1048576,
    "source": "dashboard",
    "description": "员工手册 2025 版",
    "mineruFiles": ["员工手册.md"]
  }
}
```

接入 RabbitMQ 的服务可以按需拆分 Markdown，写入对应的 Qdrant 集合。

## 在聊天界面隐藏消息

可以通过两种方式控制消息在 Agent Chat UI 中的可见性：

**1. 禁止实时流式展示：**

若不希望消息在 LLM 调用的流式过程中展示，可在聊天模型配置中加入 `langsmith:nostream` 标签。界面通常依赖 `on_chat_model_stream` 事件渲染流式消息，该标签会阻止对应模型触发此事件。

_Python 示例：_

```python
from langchain_anthropic import ChatAnthropic

# 通过 .with_config 方法新增标签
model = ChatAnthropic().with_config(
    config={"tags": ["langsmith:nostream"]}
)
```

_TypeScript 示例：_

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic()
  // 通过 .withConfig 方法新增标签
  .withConfig({ tags: ["langsmith:nostream"] });
```

**提示：**即便通过该方式隐藏流式过程，若随后原样写入图状态，消息仍会在 LLM 调用结束后出现。

**2. 永久隐藏消息：**

若希望消息在聊天界面中完全不可见（既不流式展示，也不在写入状态后出现），请在写入图状态之前将其 `id` 字段前缀改为 `do-not-render-`，并在聊天模型配置中加入 `langsmith:do-not-render` 标签。界面会显式过滤所有以该前缀开头的消息。

_Python 示例：_

```python
result = model.invoke([messages])
# 写入状态前为 ID 添加前缀
result.id = f"do-not-render-{result.id}"
return {"messages": [result]}
```

_TypeScript 示例：_

```typescript
const result = await model.invoke([messages]);
// 写入状态前为 ID 添加前缀
result.id = `do-not-render-${result.id}`;
return { messages: [result] };
```

此方式可确保消息完全不会展示给最终用户。

## 渲染 Artifact

Agent Chat UI 支持在聊天界面右侧的侧栏渲染 artifact。可通过 `thread.meta.artifact` 字段获取 artifact 上下文。以下是一个获取 artifact 上下文的工具 Hook 示例：

```tsx
export function useArtifact<TContext = Record<string, unknown>>() {
  type Component = (props: {
    children: React.ReactNode;
    title?: React.ReactNode;
  }) => React.ReactNode;

  type Context = TContext | undefined;

  type Bag = {
    open: boolean;
    setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;

    context: Context;
    setContext: (value: Context | ((prev: Context) => Context)) => void;
  };

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { artifact: [Component, Bag] } }
  >();

  return thread.meta?.artifact;
}
```

随后可以通过 `useArtifact` Hook 返回的 `Artifact` 组件渲染额外内容：

```tsx
import { useArtifact } from "../utils/use-artifact";
import { LoaderIcon } from "lucide-react";

export function Writer(props: {
  title?: string;
  content?: string;
  description?: string;
}) {
  const [Artifact, { open, setOpen }] = useArtifact();

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-lg border p-4"
      >
        <p className="font-medium">{props.title}</p>
        <p className="text-sm text-gray-500">{props.description}</p>
      </div>

      <Artifact title={props.title}>
        <p className="p-4 whitespace-pre-wrap">{props.content}</p>
      </Artifact>
    </>
  );
}
```

<a id="going-to-production"></a>
## 部署到生产环境

当你准备好上线时，需要调整连接方式并为部署环境配置鉴权。默认情况下，Agent Chat UI 面向本地开发，直接在客户端连接 LangGraph 服务器。这种方式不适用于生产环境，因为它要求每个用户都拥有自己的 LangSmith API Key，并自行配置 LangGraph。

### 生产环境设置

要让 Agent Chat UI 达到生产级别，需要在下述两种鉴权方式中选择其一。

### 快速方案：API Passthrough

最快的生产化方案是使用 [API Passthrough](https://github.com/langchain-ai/langgraph-nextjs-api-passthrough) 包。它能够轻松代理到 LangGraph 服务器，并自动处理鉴权。

本仓库已提供所需代码，只需设置好环境变量即可：

```bash
NEXT_PUBLIC_ASSISTANT_ID="agent"
# LangGraph 服务器的部署地址
LANGGRAPH_API_URL="https://my-agent.default.us.langgraph.app"
# 你的网站地址 + "/api"，即连接 API 代理的入口
NEXT_PUBLIC_API_URL="https://my-website.com/api"
# LangSmith API Key，将在 API 代理中注入到请求里
LANGSMITH_API_KEY="lsv2_..."
```

下面解释每个环境变量：

- `NEXT_PUBLIC_ASSISTANT_ID`：聊天界面在获取/提交运行时使用的助手 ID。该值不属于机密，因此保留 `NEXT_PUBLIC_` 前缀供客户端使用。
- `LANGGRAPH_API_URL`：LangGraph 服务器的生产部署地址。
- `NEXT_PUBLIC_API_URL`：你的网站地址加 `/api`，用于连接 API 代理。例如 [Agent Chat Demo](https://agentchat.vercel.app) 会设置为 `https://agentchat.vercel.app/api`，实际部署按需调整。
- `LANGSMITH_API_KEY`：连接 LangGraph 服务器时使用的 LangSmith API Key。切勿添加 `NEXT_PUBLIC_` 前缀，因为它是机密信息，仅在服务器上的 API 代理中注入请求。

更多细节可参考 [LangGraph Next.js API Passthrough](https://www.npmjs.com/package/langgraph-nextjs-api-passthrough) 文档。

### 进阶方案：自定义鉴权

在 LangGraph 部署中启用自定义鉴权是一种更高级且更可靠的方法，可让客户端直接请求而无需 LangSmith API Key，同时还能自定义访问控制。

请查阅 LangGraph 关于自定义鉴权的文档：[Python](https://langchain-ai.github.io/langgraph/tutorials/auth/getting_started/) 与 [TypeScript](https://langchain-ai.github.io/langgraphjs/how-tos/auth/custom_auth/)。完成部署配置后，需在 Agent Chat UI 中进行以下调整：

1. 在额外的 API 请求中获取来自 LangGraph 部署的鉴权令牌，用于客户端请求鉴权。
2. 将 `NEXT_PUBLIC_API_URL` 环境变量设置为生产环境的 LangGraph 部署地址。
3. 将 `NEXT_PUBLIC_ASSISTANT_ID` 设置为用于聊天的助手 ID。
4. 修改 [`useTypedStream`](src/providers/Stream.tsx)（`useStream` 的扩展）Hook，通过请求头传入鉴权令牌：

```tsx
const streamValue = useTypedStream({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  assistantId: process.env.NEXT_PUBLIC_ASSISTANT_ID,
  // ... 其他配置
  defaultHeaders: {
    Authentication: `Bearer ${addYourTokenHere}`, // 在此传入你的鉴权令牌
  },
});
```
