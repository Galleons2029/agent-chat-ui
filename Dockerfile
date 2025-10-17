# 使用官方 Node.js 镜像作为基础镜像
FROM node:22-alpine AS base

# 定义构建时参数（可以通过 --build-arg 传入）
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ASSISTANT_ID
ARG NEXT_BASE_PATH

# 设置编译时环境变量（NEXT_PUBLIC_ 变量）
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ASSISTANT_ID=${NEXT_PUBLIC_ASSISTANT_ID}
ENV NEXT_BASE_PATH=${NEXT_BASE_PATH}
ENV NODE_ENV=production


# 安装 libc6-compat 以确保兼容性
RUN apk add --no-cache libc6-compat && \
    # 国内 淘宝 镜像源
    npm config set registry https://registry.npmmirror.com/

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 依赖安装阶段
FROM base AS deps
# 复制包管理文件
COPY package.json pnpm-lock.yaml* ./
# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量禁用遥测
ENV NEXT_TELEMETRY_DISABLED 1

# 构建应用
RUN pnpm build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建 nextjs 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public

# 自动利用输出跟踪来减少镜像大小
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 28003

ENV PORT 28003
ENV HOSTNAME "0.0.0.0"
# 启动应用
CMD ["node", "server.js"]