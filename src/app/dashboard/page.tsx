'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type LucideIcon,
  Home,
  Bot,
  Database,
  FileText,
  BarChart2,
  Settings,
  Bell,
  User,
  Wallet,
  TrendingUp,
  Users,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

type NavigationItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

type StatDefinition = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  accent: {
    bg: string;
    icon: string;
  };
};

type FeaturePanel = {
  title: string;
  description?: string;
  render: () => ReactNode;
};

type FeaturePlaceholderAction = {
  label: string;
  variant?: 'primary' | 'secondary';
};

const navigationItems = [
  { id: 'ai', label: 'AI 助手', icon: Bot, color: 'bg-emerald-500' },
  { id: 'dashboard', label: '数据看板', icon: Home, color: 'bg-emerald-500' },
  { id: 'knowledge', label: '知识库', icon: Database, color: 'bg-emerald-500' },
  { id: 'accounts', label: '总分查账', icon: FileText, color: 'bg-emerald-500' },
  { id: 'analysis', label: '数据分析', icon: BarChart2, color: 'bg-emerald-500' },
  { id: 'settings', label: '系统设置', icon: Settings, color: 'bg-emerald-500' },
] as const satisfies NavigationItem[];

type PanelId = (typeof navigationItems)[number]['id'];

const dashboardStats: StatDefinition[] = [
  {
    id: 'balance',
    label: '总账户余额',
    value: '¥7,049,371.25',
    icon: Wallet,
    accent: { bg: 'bg-green-100', icon: 'text-green-600' },
  },
  {
    id: 'income',
    label: '本月收入',
    value: '¥45,678.90',
    icon: TrendingUp,
    accent: { bg: 'bg-blue-100', icon: 'text-blue-600' },
  },
  {
    id: 'activeAccounts',
    label: '活跃账户',
    value: '12',
    icon: Users,
    accent: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
  },
  {
    id: 'pending',
    label: '待处理事务',
    value: '8',
    icon: ClipboardList,
    accent: { bg: 'bg-red-100', icon: 'text-red-600' },
  },
];

const incomeExpenseData = [
  { month: 'Jan', income: 3800, expense: 2500 },
  { month: 'Feb', income: 2800, expense: 1500 },
  { month: 'Mar', income: 2000, expense: 10000 },
  { month: 'Apr', income: 2500, expense: 3500 },
  { month: 'May', income: 2000, expense: 4800 },
  { month: 'Jun', income: 2500, expense: 3200 },
  { month: 'Jul', income: 3200, expense: 4200 },
  { month: 'Aug', income: 4000, expense: 2500 },
  { month: 'Sep', income: 5200, expense: 3000 },
  { month: 'Oct', income: 4800, expense: 4000 },
  { month: 'Nov', income: 5500, expense: 2800 },
  { month: 'Dec', income: 6000, expense: 3500 },
];

const accountDistributionData = [
  { name: '企业基本账户', value: 400 },
  { name: '企业储蓄账户', value: 300 },
  { name: '外汇结算账户', value: 200 },
  { name: '专项基金账户', value: 100 },
];

const ACCOUNT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const realtimeInsightMetrics = [
  { label: '新员工培训完成率', value: '87%', helper: '较上周 +4.2%' },
  { label: '财务异常待处理', value: '3 条', helper: '已派单 2 条' },
  { label: '知识库日均访问', value: '256 次', helper: '环比 +12.4%' },
] as const;

const featurePanels: Record<PanelId, FeaturePanel> = {
  dashboard: {
    title: '数据看板',
    description: '核心指标、收入支出趋势与账户分布总览',
    render: () => <DashboardOverview />,
  },
  ai: {
    title: 'AI 助手',
    description: '构建智能问答流程，辅助内部员工完成业务咨询',
    render: () => <AIChatPanel />,
  },
  knowledge: {
    title: '知识库',
    description: '沉淀文档、政策与规范，供其他模块调用',
    render: () => (
      <FeaturePlaceholder
        icon={Database}
        title="知识库"
        description="集中管理制度、合同、审批流等资料，可与问答机器人和审批服务共享。"
        actions={[
          { label: '上传文档', variant: 'primary' },
          { label: '创建分类', variant: 'secondary' },
        ]}
      />
    ),
  },
  accounts: {
    title: '总分查账',
    description: '统一的账户视图，支持按条件筛选与导出',
    render: () => (
      <FeaturePlaceholder
        icon={FileText}
        title="总分查账"
        description="实时检索企业账户、余额和授权信息，后续可接入筛选、导出与提醒能力。"
        actions={[
          { label: '配置筛选条件', variant: 'primary' },
          { label: '导出模板设置', variant: 'secondary' },
        ]}
      />
    ),
  },
  analysis: {
    title: '数据分析',
    description: '多维度分析模型，辅助管理层做决策',
    render: () => (
      <FeaturePlaceholder
        icon={BarChart2}
        title="数据分析"
        description="搭建指标看板、维度钻取与告警策略，为经营分析提供可视化入口。"
        actions={[
          { label: '创建分析视图', variant: 'primary' },
          { label: '设置告警规则', variant: 'secondary' },
        ]}
      />
    ),
  },
  settings: {
    title: '系统设置',
    description: '统一管理组织、权限和集成配置',
    render: () => (
      <FeaturePlaceholder
        icon={Settings}
        title="系统设置"
        description="维护组织架构、角色权限与外部系统集成，确保各功能模块顺畅协同。"
        actions={[
          { label: '管理角色权限', variant: 'primary' },
          { label: '查看审计日志', variant: 'secondary' },
        ]}
      />
    ),
  },
};

function AIChatPanel() {
  return (
    <div className="h-[calc(100vh-180px)] overflow-hidden">
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Bot className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading AI Assistant...</p>
          </div>
        </div>
      }>
        <Toaster />
        <ThreadProvider>
          <StreamProvider>
            <ArtifactProvider>
              <Thread />
            </ArtifactProvider>
          </StreamProvider>
        </ThreadProvider>
      </React.Suspense>
    </div>
  );
}

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState<PanelId>('ai');
  const activePanel = featurePanels[activeMenu] ?? featurePanels.dashboard;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={navigationItems} active={activeMenu} onSelect={setActiveMenu} />

      <div className="flex-1 flex flex-col">
        <DashboardHeader title={activePanel.title} description={activePanel.description} />
        <main className={`flex-1 ${activeMenu === 'ai' ? 'p-0 overflow-hidden' : 'p-6 overflow-y-auto'}`}>
          {activePanel.render()}
        </main>
      </div>
    </div>
  );
}

type SidebarProps = {
  items: readonly NavigationItem[];
  active: PanelId;
  onSelect: (id: PanelId) => void;
};

function Sidebar({ items, active, onSelect }: SidebarProps) {
  return (
    <div className="w-64 bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-800 text-emerald-50 shadow-2xl flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">财枢智擎</h1>
            <p className="text-sm text-emerald-100/90">Bank-Copilot</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSelect(item.id as PanelId)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active === item.id
                    ? `${item.color} text-white shadow-lg shadow-emerald-900/20`
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-white">张会计</p>
            <p className="text-xs text-emerald-100/90">会计主管</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type DashboardHeaderProps = {
  title: string;
  description?: string;
};

function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="全局搜索..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="relative">
          <Bell size={25} className="text-gray-600 cursor-pointer" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </div>

        <Link
          href="/login"
          className="flex items-center space-x-2 rounded-lg border border-emerald-500 px-4 py-2 font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          <LogOut size={18} />
          <span>退出登录</span>
        </Link>
      </div>
    </header>
  );
}

function DashboardOverview() {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="月度收支趋势">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                }}
                formatter={(value) => (
                  <span style={{ color: value === '支出' ? '#ef4444' : '#10b981' }}>{value}</span>
                )}
              />
              <Line
                name="支出"
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4, fill: '#ef4444' }}
                activeDot={{ r: 6 }}
              />
              <Line
                name="收入"
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="账户分布">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={accountDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {accountDistributionData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  paddingTop: '20px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <RealtimeInsights />
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="h-80">{children}</div>
    </section>
  );
}

function StatCard({ label, value, icon: Icon, accent }: StatDefinition) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${accent.bg}`}>
          <Icon size={24} className={accent.icon} />
        </div>
      </div>
    </div>
  );
}

type FeaturePlaceholderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: FeaturePlaceholderAction[];
};

function FeaturePlaceholder({ icon: Icon, title, description, actions = [] }: FeaturePlaceholderProps) {
  return (
    <div className="min-h-[420px] bg-white rounded-xl shadow-sm flex flex-col items-center justify-center text-center p-10">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <Icon className="text-gray-500" size={36} />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>
      <p className="text-gray-500 max-w-2xl">{description}</p>

      {actions.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                action.variant === 'primary'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'border border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RealtimeInsights() {
  return (
    <section className="bg-white rounded-2xl border border-emerald-100 p-8 shadow-sm">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">实时洞察</p>
          <h2 className="text-2xl font-semibold text-gray-900 mt-3">关键运营指标</h2>
          <p className="text-gray-500 mt-4 leading-relaxed">
            汇总培训进度、财务预警与知识库访问情况。和前方的收入趋势、账户分布形成闭环，帮助你一次性掌握全局动态。
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">更新于 5 分钟前</span>
            <span className="px-3 py-1 rounded-full bg-gray-100">AI 异常监测开启</span>
          </div>
        </div>

        <div className="grid gap-4">
          {realtimeInsightMetrics.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-emerald-50 bg-gradient-to-r from-emerald-50 to-white px-6 py-4 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <span className="text-sm text-emerald-600">{item.helper}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
