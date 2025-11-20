import type { Channel, Connection } from "amqplib";
import amqp from "amqplib";

export type KnowledgeQueueMessage = {
  collection: string;
  filename: string;
  mineruTaskId: string;
  markdown: string;
  metadata: {
    uploadedAt: string;
    fileSize: number;
    source?: string;
    description?: string;
    mineruFiles?: string[];
  };
};

let connectionPromise: Promise<Connection> | null = null;

export async function publishKnowledgeMessage(message: KnowledgeQueueMessage) {
  const config = getRabbitConfig();
  const connection = await getConnection(config.url);
  const channel = await connection.createChannel();
  try {
    await channel.assertQueue(config.queue, { durable: true });
    const payload = Buffer.from(JSON.stringify(message), "utf8");
    const ok = channel.sendToQueue(config.queue, payload, {
      contentType: "application/json",
      persistent: true,
    });
    if (!ok) {
      throw new Error("RabbitMQ 拒绝接收消息");
    }
  } finally {
    await safeClose(channel);
  }
}

function getRabbitConfig() {
  const url = process.env.RABBITMQ_URL;
  const queue = process.env.RABBITMQ_KNOWLEDGE_QUEUE;
  if (!url) {
    throw new Error("缺少 RABBITMQ_URL 环境变量");
  }
  if (!queue) {
    throw new Error("缺少 RABBITMQ_KNOWLEDGE_QUEUE 环境变量");
  }
  return { url, queue };
}

async function getConnection(url: string) {
  if (!connectionPromise) {
    connectionPromise = amqp.connect(url);
    connectionPromise?.catch(() => {
      connectionPromise = null;
    });
  }
  return connectionPromise;
}

async function safeClose(channel: Channel) {
  try {
    await channel.close();
  } catch {
    // noop
  }
}

export async function resetRabbitConnection() {
  if (!connectionPromise) {
    return;
  }
  try {
    const existing = await connectionPromise;
    await existing.close();
  } catch {
    // ignore
  } finally {
    connectionPromise = null;
  }
}
