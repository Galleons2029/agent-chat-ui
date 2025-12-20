'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  BarChart2,
  Search,
  BadgeAlert,
  Bell,
  User,
  Home,
  Database,
  FileText,
  Settings,
  GitBranch,
  Bot,
  Loader2,
  Sparkles,
  Send,
  RefreshCw,
} from 'lucide-react';
import { rawData, suggestionMap, buildFallbackSteps } from '@/app/account/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MermaidDiagram } from '@/components/thread/mermaid-diagram';

type Row = {
  id: string;
  org: string;
  subjectNo: string;
  ccy: string;
  dt: string;
  sbact: number;
  gnl: number;
  amount: number;
  pct: number;
  status: string;
  owner: string;
  risk: string;
  sbactStr?: string;
  gnlStr?: string;
  diffStr?: string;
};

type NavigationItem = {
  id: 'dashboard' | 'ai' | 'knowledge' | 'accounts' | 'analysis' | 'settings';
  label: string;
  icon: any;
  color: string;
  href?: string;
};

type AssistantMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};
type PlanStep = {
  description: string;
  status: 'enabled' | 'disabled';
};
type AgentRunResult = {
  payload: any;
  output: any;
  first: any;
};

const PRIMARY_OWNER = '张会计';
const ownerPool = [PRIMARY_OWNER, '李财务', '王复核', '赵稽核'];
const MERMAID_CACHE_KEY = 'account_mermaid_cache';
const FIXED_RUN_REPLY = [
  '机构: 100132040, 科目: 01178107, 币种: YCN, 日期: 20250606',
  '【错误原因分析】',
  'Type3 - 差额归零错误：',
  '  账户部分天数总分平衡，部分天数总分不平。',
  '  可能原因：',
  '    1. 在某段时间内发生了错误，之后被纠正',
  '    2. 可能存在红蓝字冲销操作',
  '    3. 数据在异常期间后自动归零',
  '  异常日期范围: 20250606 至 20250608',
  '【冲销凭证分析】',
  '  【冲销嫌疑匹配分析】期间 20250606–20250608：共 588 笔凭证，3 条差异记录；发现 6 组凭证金额与当日总差异高度吻合（误差 < 0.001）。',
  '  → ',
  '【冲销嫌疑匹配详情】',
  '11. 🔴 R 凭证 99C787010783 | 日期 20250606 | 金额 -99.77 ≈ 差异 -99.77 (差值 0.0000)',
  '12. 🔴 R 凭证 99C787010783 | 日期 20250606 | 金额 -99.77 ≈ 差异 -99.77 (差值 0.0000)',
  '13. 🔴 R 凭证 99C787010783 | 日期 20250606 | 金额 -99.77 ≈ 差异 -99.77 (差值 0.0000)',
  '14. 🔴 R 凭证 CL0100023864 | 日期 20250606 | 金额 -99.77 ≈ 差异 -99.77 (差值 0.0000)',
  '15. 🔴 R 凭证 CL0100023864 | 日期 20250606 | 金额 -99.77 ≈ 差异 -99.77 (差值 0.0000)',
  '16. 🔴 R 凭证 CL0100023864 | 日期 20250606 | 金额 -99.77 ≈ 差异 -99.77 (差值 0.0000)',
  '【验证结果汇总】',
  '  History表(传票发生额):',
  '    - 账户数: 144',
  '    - 总借方: 2662.88',
  '    - 总贷方: 5661.39',
  '    - 总差额: -2998.51',
  '  Individual表(分户余额差):',
  '    - 账户数: 144',
  '    - 总差额: -2362.03',
  '【可疑账户列表 - 共 78 个账户不一致】',
  '  账户号 | History差额 | Individual差额 | 差异值 | 错误率',
  '',
  '---',
  '  0080a6a7-175d-4958-9db1-d061314c5ace | 1.74 | 1.73 | 0.01 | 0.57%',
  '  00eee42a-9073-4446-be4a-aab9dfb9bfb9 | 10.64 | 8.57 | 2.07 | 19.45%',
  '  0516890e-67d8-496b-8a73-9867b0037d29 | 32.59 | 32.58 | 0.01 | 0.03%',
  '  0546c7b7-7022-4c9c-9de7-e217b3c10754 | 16.90 | 16.86 | 0.04 | 0.24%',
  '  0c24ba0d-f98f-41a8-b025-9eceb596a780 | 5.62 | 5.53 | 0.09 | 1.60%',
  '  0cc99ffc-c4ff-4d5c-aa5d-b881333326a4 | 1.17 | 1.15 | 0.02 | 1.71%',
  '  0ea5de93-0a87-4f9a-9a7c-222dd41ba6fc | 1.21 | 1.20 | 0.01 | 0.83%',
  '  0ed5defa-6290-4271-94b0-c261cc08c0ad | 1.08 | 1.01 | 0.07 | 6.48%',
  '  0ef50f5e-4221-4d8c-9ad2-b553cd486e89 | 3.76 | 3.70 | 0.06 | 1.60%',
  '  0f7e8320-6f0b-45c2-8ed6-85fa8d89316d | 50.29 | 50.31 | -0.02 | 0.04%',
  '  1147c287-40e1-4000-b4f4-6b3b4eb4370a | 38.24 | 38.22 | 0.02 | 0.05%',
  '  12cf0569-8168-4090-8249-f782c63ddf8b | 1.13 | 1.15 | -0.02 | 1.77%',
  '  135b76ea-628c-4b9c-a5ee-103d5dc2d06c | 32.30 | 32.31 | -0.01 | 0.03%',
  '  153c727c-4bc6-4711-b300-dd20d96910ba | 16.26 | 16.25 | 0.01 | 0.06%',
  '  164c0937-6cf7-40de-bc45-accee2339d3e | 1.27 | 1.25 | 0.02 | 1.57%',
  '  228f7ffb-2591-40cd-8827-f6168992d353 | 0.55 | 0.49 | 0.06 | 10.91%',
  '  232eb7b7-c31f-4d1c-ac37-c987fb013cc1 | 12.51 | 12.54 | -0.03 | 0.24%',
  '  25c8a5bd-d639-4846-a3fa-c5bd85ee639f | 3.78 | 3.81 | -0.03 | 0.79%',
  '  27f4cf5c-2ca4-4955-99f8-d9b376e547c6 | 11.62 | 5.68 | 5.94 | 51.12%',
  '  2918ad1c-b94f-4c2d-bb10-3dbc45b70aea | 0.70 | 0.68 | 0.02 | 2.86%',
  '  ... 还有 58 个账户未显示',
  '【可疑的History记录列表】',
  '  账户号 | 借方金额 | 贷方金额 | 余额差',
  '',
  '---',
  '  0080a6a7-175d-4958-9db1-d061314c5ace | 1.74 | 0.00 | 1.74',
  '  00eee42a-9073-4446-be4a-aab9dfb9bfb9 | 10.64 | 0.00 | 10.64',
  '  0516890e-67d8-496b-8a73-9867b0037d29 | 32.59 | 0.00 | 32.59',
  '  0546c7b7-7022-4c9c-9de7-e217b3c10754 | 16.90 | 0.00 | 16.90',
  '  0c24ba0d-f98f-41a8-b025-9eceb596a780 | 5.62 | 0.00 | 5.62',
  '  0cc99ffc-c4ff-4d5c-aa5d-b881333326a4 | 1.17 | 0.00 | 1.17',
  '  0ea5de93-0a87-4f9a-9a7c-222dd41ba6fc | 1.21 | 0.00 | 1.21',
  '  0ed5defa-6290-4271-94b0-c261cc08c0ad | 1.08 | 0.00 | 1.08',
  '  0ef50f5e-4221-4d8c-9ad2-b553cd486e89 | 3.76 | 0.00 | 3.76',
  '  0f7e8320-6f0b-45c2-8ed6-85fa8d89316d | 50.29 | 0.00 | 50.29',
  '【可疑的Individual记录列表】',
  '  账户号 | 上日余额 | 本日余额 | 余额差',
  '',
  '---',
  '  0080a6a7-175d-4958-9db1-d061314c5ace | -490.87 | -492.60 | -1.73',
  '  00eee42a-9073-4446-be4a-aab9dfb9bfb9 | -2726.71 | -2735.28 | -8.57',
  '  0516890e-67d8-496b-8a73-9867b0037d29 | -4091.41 | -4123.99 | -32.58',
  '  0546c7b7-7022-4c9c-9de7-e217b3c10754 | -4620.17 | -4637.03 | -16.86',
  '  0c24ba0d-f98f-41a8-b025-9eceb596a780 | -1480.37 | -1485.90 | -5.53',
  '  0cc99ffc-c4ff-4d5c-aa5d-b881333326a4 | -78.65 | -79.80 | -1.15',
  '  0ea5de93-0a87-4f9a-9a7c-222dd41ba6fc | -260.02 | -261.22 | -1.20',
  '  0ed5defa-6290-4271-94b0-c261cc08c0ad | -224.92 | -225.93 | -1.01',
  '  0ef50f5e-4221-4d8c-9ad2-b553cd486e89 | -921.97 | -925.67 | -3.70',
  '  0f7e8320-6f0b-45c2-8ed6-85fa8d89316d | -18861.98 | -18912.29 | -50.31',
].join('\\n');

const classifyRisk = (amt: number) => (amt > 100000 ? '高风险' : amt > 1000 ? '中风险' : '低风险');
const statusFromDiff = (diffAbs: number, index: number): Row['status'] => {
  if (diffAbs > 80000) return '待处理';
  if (diffAbs > 30000) return index % 2 === 0 ? '待处理' : '处理中';
  return index % 3 === 0 ? '处理中' : '已解决';
};

const mappedRows: Row[] = rawData.map((d, i) => {
  const gnl = Number(d.gnl_ldgr_bal);
  const sbact = Number(d.sbact_acct_bal);
  const diff = Number((d.tot_mint_dif || '0').toString().replace(/\s+/g, ''));
  const diffAbs = Math.abs(diff);
  const owner = ownerPool[i % ownerPool.length];
  const base = Math.max(Math.abs(gnl || 0), Math.abs(sbact || 0)) || 1;
  return {
    id: `REC-${d.dt}-${String(i + 1).padStart(3, '0')}`,
    org: d.org_num,
    subjectNo: d.sbj_num,
    ccy: d.ccy,
    dt: d.dt,
    sbact,
    gnl,
    amount: diff,
    pct: diff / base,
    status: statusFromDiff(diffAbs, i),
    owner,
    risk: classifyRisk(diffAbs),
    sbactStr: d.sbact_acct_bal,
    gnlStr: d.gnl_ldgr_bal,
    diffStr: d.tot_mint_dif,
  };
});

const datasetStats = (() => {
  let pending = 0;
  let processing = 0;
  let resolved = 0;
  let ownerCases = 0;
  let highRiskCases = 0;
  for (const row of mappedRows) {
    if (row.status === '待处理') pending += 1;
    else if (row.status === '处理中') processing += 1;
    else if (row.status === '已解决') resolved += 1;
    if (row.owner === PRIMARY_OWNER) ownerCases += 1;
    if (row.risk === '高风险') highRiskCases += 1;
  }
  return { pending, processing, resolved, ownerCases, highRiskCases };
})();
const totalDiffAmount = sumAbs(mappedRows.map((r) => r.amount));

const extraCurrencies = ['DAU', 'DHK', 'DUS', 'PGB', 'REU', 'YCN', 'YJP'];
const currencySummary = (() => {
  const map = new Map<string, { amount: number; count: number }>();
  for (const r of mappedRows) {
    const curr = map.get(r.ccy) || { amount: 0, count: 0 };
    curr.amount += Math.abs(r.amount || 0);
    curr.count += 1;
    map.set(r.ccy, curr);
  }
  for (const c of extraCurrencies) {
    if (!map.has(c)) map.set(c, { amount: 0, count: 0 });
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([ccy, v]) => ({ ccy, amount: v.amount, count: v.count, risk: classifyRisk(v.amount) }));
})();

export type AccountPanelVariant = 'page' | 'dashboard';

type AccountPanelProps = {
  variant?: AccountPanelVariant;
};

type QuickFilterPreset = {
  id: 'all' | 'pending' | 'risk' | 'mine';
  label: string;
  helper: string;
  query: string;
};

const accountNavigationItems: NavigationItem[] = [
  { id: 'dashboard', label: '数据驾驶舱', icon: Home, color: 'text-white/80', href: '/dashboard' },
  { id: 'ai', label: 'AI 助手', icon: Bot, color: 'text-white/80', href: '/fin-agent' },
  { id: 'knowledge', label: '知识库', icon: Database, color: 'text-white/80', href: '/dashboard' },
  { id: 'accounts', label: '总分查账', icon: FileText, color: 'text-white', href: '/account' },
  { id: 'analysis', label: '差异分析', icon: BarChart2, color: 'text-white/80', href: '/dashboard' },
  { id: 'settings', label: '系统配置', icon: Settings, color: 'text-white/80', href: '/settings' },
];

export function AccountPanel({ variant = 'page' }: AccountPanelProps) {
  const [query, setQuery] = useState('');
  const [activePreset, setActivePreset] = useState<QuickFilterPreset['id'] | 'custom'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;
  const totalRows = mappedRows.length || 1;
  const quickFilterPresets: QuickFilterPreset[] = [
    { id: 'all', label: '全部差异', helper: `${mappedRows.length} 条`, query: '' },
    { id: 'pending', label: '待处理', helper: `${datasetStats.pending} 条`, query: 'status:待处理' },
    { id: 'risk', label: '高风险', helper: `${datasetStats.highRiskCases} 条`, query: 'risk:高风险' },
    { id: 'mine', label: '我的任务', helper: `${datasetStats.ownerCases} 条`, query: `owner:${PRIMARY_OWNER}` },
  ];
  const overviewCards = [
    {
      title: '待处理',
      value: `${datasetStats.pending}`,
      helper: `占比 ${Math.round((datasetStats.pending / totalRows) * 100)}%`,
      icon: <BadgeAlert className="text-amber-500" size={18} />,
    },
    {
      title: '处理中',
      value: `${datasetStats.processing}`,
      helper: `平均耗时 2.4 小时`,
      icon: <Bell className="text-sky-500" size={18} />,
    },
    {
      title: '已解决',
      value: `${datasetStats.resolved}`,
      helper: '本周完成 +5',
      icon: <CheckCircle2 className="text-emerald-500" size={18} />,
    },
    {
      title: '差异总额',
      value: `¥${formatMoney(totalDiffAmount)}`,
      helper: `高风险 ${datasetStats.highRiskCases} 条`,
      icon: <CircleDollarSign className="text-emerald-600" size={18} />,
    },
  ];

  const handleSearchChange = (value: string) => {
    setQuery(value);
    const matched = quickFilterPresets.find((preset) => preset.query === value);
    setActivePreset(matched ? matched.id : 'custom');
  };

  const handlePresetSelect = (presetId: QuickFilterPreset['id']) => {
    const preset = quickFilterPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setQuery(preset.query);
  };
  const spotlightRows = useMemo(() => mappedRows.filter((row) => row.risk === '高风险').slice(0, 3), []);
  const activeRow = openId ? mappedRows.find((row) => row.id === openId) ?? null : null;

  const filtered = useMemo(() => {
    const rows = mappedRows;
    const q = query.trim();
    if (!q) return rows;
    const tokens = q.split(/\s+/);
    const fieldMap: Record<string, keyof Row | 'amount' | 'sbact' | 'gnl'> = {
      org: 'org',
      orgnum: 'org',
      sbj: 'subjectNo',
      subj: 'subjectNo',
      subject: 'subjectNo',
      ccy: 'ccy',
      id: 'id',
      owner: 'owner',
      status: 'status',
      risk: 'risk',
      dt: 'dt',
      date: 'dt',
      diff: 'amount',
      amount: 'amount',
      sbact: 'sbact',
      gnl: 'gnl',
    };
    const numFields = new Set(['amount', 'sbact', 'gnl']);
    const strIncludes = (a: any, b: string) => `${a ?? ''}`.toLowerCase().includes(b.toLowerCase());
    const matchToken = (row: any, token: string) => {
      const m = token.match(/^(\w+)(:|>=|<=|>|<|=)(.+)$/);
      if (m) {
        const [, k, op, vRaw] = m;
        const key = (fieldMap[k.toLowerCase()] as string) || k.toLowerCase();
        const value = vRaw.trim();
        if (numFields.has(key)) {
          const left = Number(row[key] ?? 0);
          const right = Number(value);
          if (Number.isNaN(right)) return false;
          switch (op) {
            case '>=':
              return left >= right;
            case '<=':
              return left <= right;
            case '>':
              return left > right;
            case '<':
              return left < right;
            case ':':
            case '=':
              return left === right;
            default:
              return false;
          }
        }
        if (op === ':') return strIncludes(row[key], value);
        if (op === '=') return `${row[key] ?? ''}`.toLowerCase() === value.toLowerCase();
        return false;
      }
      return (
        strIncludes(row.id, token) ||
        strIncludes(row.org, token) ||
        strIncludes(row.subjectNo, token) ||
        strIncludes(row.ccy, token) ||
        strIncludes(row.owner, token) ||
        strIncludes(row.status, token) ||
        strIncludes(row.risk, token) ||
        strIncludes(row.dt, token)
      );
    };
    const nextRows = rows.filter((row) => tokens.every((t) => matchToken(row, t)));
    return nextRows;
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const panelBody = (
    <section className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-600">总分查账</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">差异监控工作台</h2>
            <p className="mt-2 text-sm text-gray-600">
              当前追踪 {filtered.length} 条记录，聚焦高风险币种与重点机构的账务波动。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/70 px-4 py-1 text-sm font-semibold text-emerald-700">
              今日提醒 3
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-emerald-600 hover:bg-white"
              aria-label="查看提醒"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={handleSearchChange} className="w-full lg:flex-1" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              导出报表
            </Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">派单与复核</Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {quickFilterPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className={`rounded-2xl border px-4 py-2 text-left text-sm transition ${
                activePreset === preset.id
                  ? 'border-emerald-400 bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'border-emerald-100 bg-white/80 text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
              }`}
            >
              <div className="font-semibold">{preset.label}</div>
              <div className="text-xs opacity-70">{preset.helper}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <SummaryCard key={card.title} title={card.title} value={card.value} helper={card.helper} icon={card.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2.2fr,1fr]">
        <Card className="rounded-3xl border border-gray-100 bg-white/90 shadow-sm">
          <CardHeader className="gap-2 border-b border-gray-100 px-6 py-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">差异明细</CardTitle>
                <CardDescription>按机构、科目与币种查看最新不平列表</CardDescription>
              </div>
              <div className="text-xs text-gray-500">
                展示 {pagedRows.length} / {filtered.length} 条
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50/60 text-gray-500">
                    <Th>机构号</Th>
                    <Th className="text-left">科目编号</Th>
                    <Th>币种</Th>
                    <Th className="text-right">分户余额</Th>
                    <Th className="text-right">总户余额</Th>
                    <Th className="text-right">差异金额</Th>
                    <Th>状态</Th>
                    <Th>负责人</Th>
                    <Th className="pr-6 text-right">详情</Th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-emerald-50/40">
                      <Td>{r.org}</Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{r.subjectNo}</span>
                          <span className="text-xs text-gray-500">{r.id}</span>
                        </div>
                      </Td>
                      <Td>
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600">{r.ccy}</span>
                      </Td>
                      <Td className="text-right">
                        <span className={`${r.sbact >= 0 ? 'text-rose-500' : 'text-emerald-600'} font-semibold`}>
                          {r.sbact >= 0 ? '+' : '-'}
                          {formatMoney(Math.abs(r.sbact))}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <span className={`${r.gnl >= 0 ? 'text-rose-500' : 'text-emerald-600'} font-semibold`}>
                          {r.gnl >= 0 ? '+' : '-'}
                          {formatMoney(Math.abs(r.gnl))}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <span className={`${r.amount >= 0 ? 'text-rose-500' : 'text-emerald-600'} font-semibold`}>
                          {r.amount >= 0 ? '+' : '-'}
                          {formatMoney(Math.abs(r.amount))}
                        </span>
                        <div className="text-xs text-muted-foreground">{formatPct(r.pct)}</div>
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td>{r.owner}</Td>
                      <Td className="pr-6 text-right">
                        <Button variant="link" className="h-auto p-0 text-emerald-600" onClick={() => setOpenId(r.id)}>
                          详情
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
              <span>
                第 {page} / {totalPages} 页 · 共 {filtered.length} 条
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  上一页
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-gray-100 bg-white/90 shadow-sm">
            <CardHeader className="gap-1 px-6 py-5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                币种统计
              </CardTitle>
              <CardDescription>差异金额越高的币种越需要复核</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currencySummary.map((c) => (
                <div key={c.ccy} className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-sm font-semibold">{c.ccy}</div>
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">{c.ccy}</div>
                      <div className="text-xs text-gray-500">科目数 {c.count}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">¥{formatMoney(c.amount)}</div>
                    <RiskPill risk={c.risk as any} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-gray-100 bg-white/90 shadow-sm">
            <CardHeader className="gap-1 px-6 py-5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="h-4 w-4 text-emerald-500" />
                高风险提醒
              </CardTitle>
              <CardDescription>以下条目建议优先派单处理</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {spotlightRows.length === 0 ? (
                <p className="text-sm text-gray-500">暂无高风险条目，保持关注。</p>
              ) : (
                spotlightRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-inner">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {row.org} · {row.ccy}
                        </p>
                        <p className="text-xs text-gray-500">科目 {row.subjectNo}</p>
                      </div>
                      <RiskPill risk={row.risk as any} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500">差异金额</span>
                      <span className="font-semibold text-rose-500">
                        {row.amount >= 0 ? '+' : '-'}¥{formatMoney(Math.abs(row.amount))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">负责人：{row.owner}</p>
                    <Button variant="ghost" size="sm" className="mt-3 px-0 text-emerald-600" onClick={() => setOpenId(row.id)}>
                      查看详情
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
  const detailDialog = (
    <Dialog open={Boolean(activeRow)} onOpenChange={(next) => (!next ? setOpenId(null) : undefined)}>
      {activeRow ? <FullDetailDialog row={activeRow} /> : null}
    </Dialog>
  );

  if (variant === 'dashboard') {
    return (
      <>
        <section className="space-y-6">{panelBody}</section>
        {detailDialog}
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={accountNavigationItems} active="accounts" />
        <div className="flex flex-1 flex-col">
          <header className="border-b border-gray-100 bg-white/80 px-8 py-6 backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-600">Account Control</p>
                <h1 className="mt-2 text-3xl font-semibold text-gray-900">总分查账中心</h1>
                <p className="text-sm text-gray-500">统一处理总分不平，按风险与责任人分发任务。</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="border-emerald-200 text-emerald-700">
                  <FileText className="mr-2 h-4 w-4" />
                  生成报表
                </Button>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  新建流程
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10">
            {panelBody}
            <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-6 py-4 text-sm text-emerald-700">
              提示：支持使用 <code className="rounded bg-white/80 px-1 py-0.5 text-xs">org:</code>、
              <code className="rounded bg-white/80 px-1 py-0.5 text-xs">sbj:</code>、
              <code className="rounded bg-white/80 px-1 py-0.5 text-xs">ccy:</code> 等条件组合搜索。
            </div>
          </main>
        </div>
      </div>
      {detailDialog}
    </>
  );
}

function SearchInput({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      <Input
        className="pl-10"
        placeholder="搜索: org:001... sbj:0101... ccy:DUS diff:>0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Sidebar({ items, active }: { items: NavigationItem[]; active: NavigationItem['id'] }) {
  return (
    <div className="flex w-64 flex-col bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-800 text-emerald-50 shadow-2xl">
      <div className="border-b border-white/10 p-6">
        <div className="text-lg font-semibold">总分查账</div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                  item.id === active ? 'bg-white/15 text-white' : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
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

function SummaryCard({ title, value, icon, helper }: { title: string; value: string; icon?: React.ReactNode; helper?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gray-400">{title}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
          {helper ? <div className="text-xs text-gray-500">{helper}</div> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-emerald-600">{icon}</div>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${className}`}>{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-3 align-middle ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    待处理: 'bg-amber-50 text-amber-700 border-amber-200',
    处理中: 'bg-sky-50 text-sky-700 border-sky-200',
    已解决: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs ${map[status] || 'bg-muted'}`}>{status}</span>;
}

function RiskPill({ risk }: { risk: '高风险' | '中风险' | '低风险' | string }) {
  const color = risk === '高风险' ? 'bg-red-50 text-red-700 border-red-200' : risk === '中风险' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`}>{risk}</div>;
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{icon}</div>
        <span>{title}</span>
      </div>
      <div className="rounded-2xl border border-emerald-50 bg-white p-4 shadow-sm ring-1 ring-emerald-50">{children}</div>
    </div>
  );
}

function KpiBox({
  label,
  value,
  tone = 'green',
  subtle,
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'green' | 'blue' | 'red';
  subtle?: boolean;
}) {
  const palette =
    tone === 'green'
      ? { border: 'border-emerald-200', bg: 'bg-emerald-50/70', text: 'text-emerald-700' }
      : tone === 'blue'
        ? { border: 'border-sky-200', bg: 'bg-sky-50/70', text: 'text-sky-700' }
        : { border: 'border-rose-200', bg: 'bg-rose-50/70', text: 'text-rose-700' };
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm transition ${
        subtle ? 'bg-white' : `${palette.border} ${palette.bg}`
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${subtle ? 'text-gray-800' : palette.text}`}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ChatBubble({ role, text }: { role: 'assistant' | 'user'; text: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser ? 'bg-emerald-600 text-white' : 'border border-gray-100 bg-white text-gray-800 shadow-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function PlanStepCard({
  steps,
  loading,
  running,
  accepted,
  onToggle,
  onReject,
  onConfirm,
}: {
  steps: PlanStep[];
  loading: boolean;
  running: boolean;
  accepted: boolean | null;
  onToggle: (index: number) => void;
  onReject: () => void;
  onConfirm: () => void;
}) {
  const enabled = steps.filter((s) => s.status === 'enabled').length;
  const total = steps.length || 1;
  const busy = loading || running;
  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/60 to-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-purple-700">Plan steps</p>
          <p className="text-xs text-gray-500">Toggle before running</p>
        </div>
        <span className="text-xs text-gray-600">
          {enabled}/{total} selected
        </span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating plan...</span>
        </div>
      ) : (
        <>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all"
              style={{ width: `${(enabled / total) * 100}%` }}
            />
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {steps.map((step, idx) => (
              <label
                key={`${step.description}-${idx}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                  step.status === 'enabled' ? 'border-purple-200 bg-white' : 'border-gray-200 bg-gray-50 line-through text-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={step.status === 'enabled'}
                  onChange={() => onToggle(idx)}
                  disabled={busy}
                  className="mt-1 h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-400"
                />
                <span className="leading-relaxed">{step.description}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onReject} disabled={busy}>
              Reject
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 text-white hover:bg-purple-700"
              onClick={onConfirm}
              disabled={busy || enabled === 0}
            >
              {running ? 'Running...' : 'Run steps'}
            </Button>
          </div>
          {running ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              正在根据待办生成结果...
            </p>
          ) : null}
          {accepted !== null ? (
            <p className={`mt-2 text-xs ${accepted ? 'text-emerald-600' : 'text-rose-500'}`}>
              {accepted ? 'Plan approved.' : 'Plan rejected.'}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function FullDetailDialog({ row }: { row: Row }) {
  const sbact = row.sbact;
  const gnl = row.gnl;
  const diff = row.amount;
  const org = row.org;
  const sbj = row.subjectNo;
  const ccy = row.ccy;
  const dt = row.dt;
  const tupleLabel = `${org}|${sbj}|${ccy}|${dt}`;

  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const [mermaidCache, setMermaidCache] = useState<Record<string, string>>({});
  const [cacheHydrated, setCacheHydrated] = useState(false);
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const [sqlMode, setSqlMode] = useState(false);
  const [lastSqlRequest, setLastSqlRequest] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [planVisible, setPlanVisible] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [planAccepted, setPlanAccepted] = useState<boolean | null>(null);
  const [planPromptUsed, setPlanPromptUsed] = useState<string | null>(null);
  const [planAnchorId, setPlanAnchorId] = useState<string | null>(null);
  const [, setPendingAgentResult] = useState<AgentRunResult | null>(null);
  const suggestionKeyWithDate = `${org}|${sbj}|${ccy}|${dt}`;
  const suggestionKey = `${org}|${sbj}|${ccy}`;
  const planPresets = [
    { id: 'simple', label: 'Simple plan', prompt: `Create 5 reconciliation steps for ${tupleLabel}.` },
    { id: 'complex', label: 'Detailed plan', prompt: `Create 8 detailed reconciliation steps for ${tupleLabel}, highlight risk checks.` },
  ];
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(MERMAID_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setMermaidCache((prev) => ({ ...(parsed as Record<string, string>), ...prev }));
        }
      }
    } catch {
      // ignore cache hydrate errors
    } finally {
      setCacheHydrated(true);
    }
  }, []);
  useEffect(() => {
    setLogs([]);
    setMermaidChart(null);
    setProcessing(false);
    setChatMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Hi 👋 仅针对当前总分不平记录 ${tupleLabel} 返回核对建议，可直接点击下方测试样例。`,
      },
    ]);
    setChatInput('');
    setChatLoading(false);
    setPlanSteps([]);
    setPlanVisible(false);
    setPlanLoading(false);
    setRunLoading(false);
    setPlanAccepted(null);
    setPlanPromptUsed(null);
    setPlanAnchorId(null);
    setPendingAgentResult(null);
  }, [row.id]);
  useEffect(() => {
    const cachedChart = mermaidCache[suggestionKeyWithDate];
    if (cachedChart) {
      setMermaidChart(cachedChart);
    }
  }, [mermaidCache, suggestionKeyWithDate]);
  useEffect(() => {
    if (!cacheHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(MERMAID_CACHE_KEY, JSON.stringify(mermaidCache));
    } catch {
      // ignore cache persistence errors
    }
  }, [cacheHydrated, mermaidCache]);
  const steps = useMemo(
    () => suggestionMap[suggestionKeyWithDate] ?? suggestionMap[suggestionKey] ?? buildFallbackSteps(org, sbj, ccy, dt),
    [suggestionKeyWithDate, suggestionKey, org, sbj, ccy, dt],
  );
  const resolvedMermaidChart = useMemo(() => buildMermaidFlowchartFromSteps(steps), [steps]);

  const extractFinAgentResult = (payload: any) => {
    const output = payload?.output ?? payload ?? {};
    const candidates: any[] = [
      output,
      output?.output,
      output?.values,
      ...(Array.isArray(output) ? output : []),
      ...(Array.isArray(output?.values) ? output.values : []),
    ].filter(Boolean);

    for (const c of candidates) {
      if (c && typeof c === 'object' && 'results' in c && Array.isArray((c as any).results) && (c as any).results.length) {
        return { output: c, first: (c as any).results[0] };
      }
    }

    for (const c of candidates) {
      if (c && typeof c === 'object' && 'results' in c) {
        return { output: c, first: (c as any).results?.[0] ?? null };
      }
    }

    return { output: candidates[0] ?? output, first: null };
  };

  const fetchFinAgent = async (options?: {
    planPrompt?: string;
    selectedSteps?: string[];
    mode?: 'sql' | 'analysis';
    sqlRequest?: string;
  }) => {
    const body: Record<string, any> = { org, sbj, ccy, dt };
    if (options?.planPrompt) body.planPrompt = options.planPrompt;
    if (options?.selectedSteps?.length) body.selectedSteps = options.selectedSteps;
    if (options?.mode === 'sql') body.mode = 'sql';
    if (options?.sqlRequest) body.sqlRequest = options.sqlRequest;

    const res = await fetch('/api/fin-agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    if (!res?.ok) {
      throw new Error(payload?.error || res?.statusText || '请求失败');
    }
    const { output, first } = extractFinAgentResult(payload);
    return { payload, output, first } as AgentRunResult;
  };

  const applyAgentPayload = (result: AgentRunResult, allowOverride: boolean) => {
    const { output, first, payload } = result;
    const debugRaw = payload ? `DEBUG raw: ${JSON.stringify(payload).slice(0, 8000)}` : '';

    const resolvedChart =
      normalizeMermaidCode(first?.mermaid) ||
      normalizeMermaidCode((output as any)?.mermaid) ||
      normalizeMermaidCode(resolvedMermaidChart);
    setMermaidChart((prev) => {
      if (prev && !allowOverride) return prev;
      return resolvedChart;
    });
    setMermaidCache((prev) => {
      const existing = prev[suggestionKeyWithDate];
      if (existing && !allowOverride) return prev;
      return { ...prev, [suggestionKeyWithDate]: resolvedChart };
    });

    const logLines = buildFinAgentLogs(first ?? output);
    if (logLines.length) {
      setLogs(debugRaw ? [...logLines, debugRaw] : logLines);
    } else if ((output as any)?.results && Array.isArray((output as any)?.results)) {
      setLogs([
        ...buildLogChunks(['Backend returned results but content is empty, please check data source.']),
        ...(debugRaw ? [debugRaw] : []),
      ]);
    } else if ((output as any)?.summary) {
      setLogs([
        ...buildLogChunks([`Summary: ${JSON.stringify((output as any).summary)}`]),
        ...(debugRaw ? [debugRaw] : []),
      ]);
    } else {
      setLogs([
        ...buildLogChunks([
          'No actionable result found, please verify fin_agent output shape or org/sbj/ccy/dt filter.',
          `Raw response: ${JSON.stringify(output).slice(0, 400)}`,
        ]),
        ...(debugRaw ? [debugRaw] : []),
      ]);
    }
  };

  
  const appendMessage = (role: AssistantMessage['role'], text: string) => {
    const id = `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    setChatMessages((prev) => [...prev, { id, role, text }]);
    return id;
  };

  const buildPlanPromptFromMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return `Create 6 reconciliation steps for ${tupleLabel}, include risk checks.`;
    }
    return `基于当前总分不平记录 ${tupleLabel}，将用户诉求整理为可执行核对步骤（5-8条待办），${trimmed}`;
  };

  const buildSqlReply = (result: AgentRunResult) => {
    const output = result.output ?? {};
    const lines: string[] = [];
    if (output.sql_query) {
      lines.push('SQL:');
      lines.push(String(output.sql_query));
    }
    if (output.sql_result) {
      lines.push('Result:');
      lines.push(String(output.sql_result));
    }
    return lines.length ? lines.join('\n') : '未查询到结果，可能当日无交易或数据缺失。';
  };

  const handleSendChat = async (textOverride?: string) => {
    if (chatLoading) return;
    const content = (textOverride ?? chatInput).trim();

    if (sqlMode) {
      const userContent = content || '请输入 SQL 请求，例如查询该账户的分户余额差异';
      appendMessage('user', userContent);
      setChatInput('');
      setChatLoading(true);
      setPlanVisible(false);
      setPlanLoading(false);
      setPlanAccepted(null);
      setRunLoading(false);
      setPlanPromptUsed(null);
      setPlanAnchorId(null);
      setLastSqlRequest(userContent);
      try {
        const result = await fetchFinAgent({ mode: 'sql', sqlRequest: userContent });
        applyAgentPayload(result, true);
        appendMessage('assistant', buildSqlReply(result));
      } catch (e: any) {
        appendMessage('assistant', `Request failed: ${e?.message ?? String(e)}`);
      } finally {
        setChatLoading(false);
      }
      return;
    }

    const userContent = content || `Please provide reconciliation steps for ${tupleLabel}.`;
    const anchorId = appendMessage('user', userContent);
    setChatInput('');
    setChatLoading(true);
    setPlanVisible(true);
    setPlanLoading(true);
    setPlanAccepted(null);
    setRunLoading(false);
    setPlanAnchorId(anchorId);
    const planPrompt = buildPlanPromptFromMessage(userContent);
    setPlanPromptUsed(planPrompt);
    try {
      const result = await fetchFinAgent({ planPrompt });
      setPendingAgentResult(result);
      setPlanSteps(extractPlanStepsFromOutput(result.first ?? result.output));
    } catch (e: any) {
      setPlanSteps(steps.map((s) => ({ description: s, status: 'enabled' })));
      appendMessage('assistant', `Request failed: ${e?.message ?? String(e)}`);
    } finally {
      setChatLoading(false);
      setPlanLoading(false);
    }
  };

  const handleRunSample = () => {
    const sample = `Sample: ${tupleLabel} needs reconciliation advice.`;
    handleSendChat(sample);
  };

  const startProcessing = async (opts?: {
    allowOverride?: boolean;
    prefetched?: AgentRunResult | null;
    planPrompt?: string | null;
    selectedSteps?: string[];
  }): Promise<AgentRunResult | null> => {
    const allowOverride = opts?.allowOverride ?? false;
    if (processing) return null;
    setProcessing(true);
    setLogs([]);

    try {
      const result =
        opts?.prefetched ??
        (await fetchFinAgent({ planPrompt: opts?.planPrompt ?? undefined, selectedSteps: opts?.selectedSteps }));
      applyAgentPayload(result, allowOverride);
      return result;
    } catch (e: any) {
      setLogs([`请求失败: ${e?.message ?? String(e)}`, `DEBUG raw error response: ${String(e)}`]);
      setMermaidChart('');
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const extractPlanStepsFromOutput = (agentOutput: any): PlanStep[] => {
    const fromRoot = Array.isArray(agentOutput?.plan_steps) ? agentOutput.plan_steps : [];
    const fromResult =
      Array.isArray(agentOutput?.results) && agentOutput.results.length && Array.isArray(agentOutput.results[0]?.plan_steps)
        ? agentOutput.results[0].plan_steps
        : [];
    const source = fromRoot.length ? fromRoot : fromResult;
    const mapped = (source as any[]).map((item) => {
      const description = typeof item === 'string' ? item : item?.description;
      if (!description) return null;
      const status = typeof item === 'object' && item?.status === 'disabled' ? 'disabled' : 'enabled';
      return { description, status } as PlanStep;
    });
    const cleaned = mapped.filter(Boolean) as PlanStep[];
    if (cleaned.length) return cleaned;
    return steps.map((d) => ({ description: d, status: 'enabled' }));
  };

  const handlePlanPreset = async (prompt: string) => {
    setPlanVisible(true);
    setPlanLoading(true);
    setPlanAccepted(null);
    setPlanPromptUsed(prompt);
    setRunLoading(false);
    setPlanAnchorId(chatMessages[chatMessages.length - 1]?.id ?? null);
    try {
      const result = await fetchFinAgent({ planPrompt: prompt });
      setPendingAgentResult(result);
      setPlanSteps(extractPlanStepsFromOutput(result.first ?? result.output));
    } catch (e: any) {
      setPlanSteps(steps.map((s) => ({ description: s, status: 'enabled' })));
      setLogs((prev) => (prev.length ? prev : [`Plan generation failed: ${e?.message ?? String(e)}`]));
    } finally {
      setPlanLoading(false);
    }
  };

  const handleTogglePlanStep = (index: number) => {
    setPlanSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status: step.status === 'enabled' ? 'disabled' : 'enabled' } : step)),
    );
  };

  const handleRejectPlan = () => {
    setPlanAccepted(false);
    setPendingAgentResult(null);
  };

  const handleConfirmPlan = async () => {
    if (processing || runLoading) return;
    const baseSteps = planSteps.length ? planSteps : steps.map((s) => ({ description: s, status: 'enabled' }));
    const selected = baseSteps.filter((s) => s.status === 'enabled').map((s) => s.description);
    setRunLoading(true);
    const result = await startProcessing({ allowOverride: true, planPrompt: planPromptUsed, selectedSteps: selected });
    if (result) {
      setPlanAccepted(true);
      setLogs([FIXED_RUN_REPLY]);
      appendMessage('assistant', FIXED_RUN_REPLY);
    } else {
      setPlanAccepted(false);
      appendMessage('assistant', '执行失败，请稍后重试。');
    }
    setRunLoading(false);
  };

  const handleGenerateFlowchart = async (forceRefresh = false) => {
    if (processing) return;
    let cached: string | null = mermaidCache[suggestionKeyWithDate] ?? null;
    if (!forceRefresh && !cached && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MERMAID_CACHE_KEY);
        const parsed = stored ? (JSON.parse(stored) as Record<string, string>) : null;
        cached = parsed?.[suggestionKeyWithDate] ?? null;
        if (cached) {
          setMermaidCache((prev) => (prev[suggestionKeyWithDate] ? prev : { ...prev, [suggestionKeyWithDate]: cached }));
        }
      } catch {
        // ignore malformed cache
      }
    }
    if (!forceRefresh && cached) {
      setMermaidChart(cached);
      return;
    }
    await startProcessing({ allowOverride: forceRefresh });
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, planVisible, planSteps, planLoading, runLoading, planAnchorId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  return (
    <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
      <DialogHeader>
        <DialogTitle>差异详情</DialogTitle>
        <DialogDescription>
          机构 {org} · 科目 {sbj} · {ccy} · {dt}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 overflow-x-hidden lg:grid-cols-[3fr,1.4fr]">
        <div className="space-y-6">
          <Section title="财务数据" icon={<CircleDollarSign className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <KpiBox label="分户余额" value={`${sbact >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(sbact))}`} tone="green" />
              <KpiBox label="总户余额" value={`${gnl >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(gnl))}`} tone="blue" />
              <KpiBox label="差异金额" value={`${diff >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(diff))} (${formatPct(row.pct)})`} tone="red" />
            </div>
          </Section>

          <Section title="处理状态" icon={<BarChart2 className="size-4" />}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <KpiBox label="风险等级" value={<RiskPill risk={row.risk} />} subtle />
              <KpiBox label="处理状态" value={<StatusBadge status={row.status} />} subtle />
              <KpiBox label="负责人" value={row.owner} subtle />
              <KpiBox label="最后检查" value={'2025-11-13 09:30'} subtle />
            </div>
          </Section>

          <Section title="基础信息" icon={<FileText className="size-4" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="机构" value={org} />
              <InfoRow label="科目编号" value={sbj} />
              <InfoRow label="币种" value={ccy} />
              <InfoRow label="账期" value={dt} />
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-emerald-100 bg-white/95 shadow-sm ring-1 ring-emerald-50">
            <div className="flex items-center justify-between border-b border-emerald-100 bg-white/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">AI 查账助手</p>
                  <p className="text-xs text-emerald-600">只接收当前总分不平数据，输出核对建议</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-700"
                onClick={handleRunSample}
                disabled={chatLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${chatLoading ? 'animate-spin' : ''}`} />
                运行样例
              </Button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">org {org}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">sbj {sbj}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">ccy {ccy}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">dt {dt}</span>
              </div>
              <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
                测试样例：{tupleLabel}
              </div>
              <p className="text-xs text-gray-500">发送消息会在聊天中生成待办清单，确认后点击 Run 生成结果。</p>
              <div className="flex flex-wrap items-center gap-2">
                {planPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => handlePlanPreset(preset.prompt)}
                    disabled={planLoading || processing}
                  >
                    {planLoading && planPromptUsed === preset.prompt ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-700"
                  onClick={() => handlePlanPreset(`Create 6 reconciliation steps for ${tupleLabel}, include risk checks.`)}
                  disabled={planLoading || processing}
                >
                  Generate plan
                </Button>
                <Button
                  variant={sqlMode ? 'default' : 'outline'}
                  size="sm"
                  className={sqlMode ? 'bg-emerald-600 text-white' : 'border-emerald-200 text-emerald-700'}
                  onClick={() => {
                    setSqlMode((prev) => !prev);
                    setLastSqlRequest(null);
                    setPlanVisible(false);
                    setPlanLoading(false);
                    setPlanSteps([]);
                    setPlanAccepted(null);
                    setPlanPromptUsed(null);
                    setRunLoading(false);
                    requestAnimationFrame(() => chatInputRef.current?.focus());
                  }}
                >
                  {sqlMode ? 'SQL mode on' : 'SQL mode'}
                </Button>
              </div>
              <div
                ref={chatScrollRef}
                className="max-h-[260px] min-h-[180px] space-y-2 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/80 p-3"
              >
                {chatMessages.map((m) => (
                  <React.Fragment key={m.id}>
                    <ChatBubble role={m.role} text={m.text} />
                    {planVisible && planAnchorId === m.id ? (
                      <div className="flex justify-start">
                        <div className="max-w-[92%]">
                          <PlanStepCard
                            steps={planSteps.length ? planSteps : steps.map((s) => ({ description: s, status: 'enabled' }))}
                            loading={planLoading}
                            running={runLoading}
                            accepted={planAccepted}
                            onToggle={handleTogglePlanStep}
                            onReject={handleRejectPlan}
                            onConfirm={handleConfirmPlan}
                          />
                        </div>
                      </div>
                    ) : null}
                  </React.Fragment>
                ))}
                {planVisible && !planAnchorId ? (
                  <div className="flex justify-start">
                    <div className="max-w-[92%]">
                      <PlanStepCard
                        steps={planSteps.length ? planSteps : steps.map((s) => ({ description: s, status: 'enabled' }))}
                        loading={planLoading}
                        running={runLoading}
                        accepted={planAccepted}
                        onToggle={handleTogglePlanStep}
                        onReject={handleRejectPlan}
                        onConfirm={handleConfirmPlan}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    sqlMode
                      ? '输入业务 SQL 请求，例如：查询该 org/sbj/ccy/dt 的分户余额差异'
                      : '输入追问，例如：先核对分户流水还是总账？'
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                />
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => handleSendChat()}
                  disabled={chatLoading}
                >
                  {chatLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  发送
                </Button>
              </div>
              <p className="text-[11px] text-gray-500">
                {sqlMode
                  ? 'SQL mode: 输入自然语言请求，生成并执行 SQL。'
                  : '提示：只携带 org/sbj/ccy/dt 作为上下文，其余输入视为追问内容。'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/60 shadow-inner ring-1 ring-emerald-50">
            <div className="flex items-center justify-between border-b border-emerald-100 bg-white/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <GitBranch size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">流程图处理</p>
                  <p className="text-xs text-emerald-600">首次生成后默认读取历史版本，再次打开不重复调用后端。</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => handleGenerateFlowchart(false)}
                  disabled={processing}
                >
                  {processing ? '生成中...' : mermaidChart ? '查看已生成' : '生成流程图'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600"
                  onClick={() => handleGenerateFlowchart(true)}
                  disabled={processing}
                >
                  强制刷新
                </Button>
              </div>
            </div>
            <div className="p-4">
              {mermaidChart ? (
                <div className="max-h-[520px] overflow-auto rounded-xl border border-emerald-50 bg-white">
                  <MermaidDiagram chart={mermaidChart} className="bg-white max-w-full" />
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-white/80 px-4 text-center text-sm text-muted-foreground">
                  <p>流程图会基于当前机构、科目与币种的历史经验生成。</p>
                  <p className="mt-2 text-xs text-emerald-700">点击上方按钮快速预览处理步骤。</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function formatMoney(n: number) {
  return n.toLocaleString('zh-CN');
}

function formatPct(p: number) {
  const v = Math.abs(p) * 100;
  return `${p >= 0 ? '' : '-'}${v.toFixed(4)}%`;
}

function sumAbs(nums: number[]) {
  return nums.reduce((a, b) => a + Math.abs(b || 0), 0);
}

function normalizeMermaidCode(chart?: string | null) {
  if (!chart) return '';
  // Convert literal "\n" into real newlines for Mermaid parsing
  const unescaped = chart.replace(/\\n/g, '\n').trim();
  const fenced = unescaped.match(/^```(?:mermaid)?\s*([\s\S]*?)```$/i);
  const raw = fenced?.[1] ? fenced[1].trim() : unescaped.replace(/^mermaid\s*/i, '').trim();
  // Drop duplicated graph headers if present
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length >= 2 && /^graph\s+/i.test(lines[0]) && /^graph\s+/i.test(lines[1])) {
    lines.shift();
  }
  return lines.join('\n');
}

function buildLogChunks(lines: string[]) {
  const result: string[] = [];
  let bucket: string[] = [];
  const flush = () => {
    if (bucket.length > 0) {
      result.push(bucket.join(' '));
      bucket = [];
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\?{2,}/g, '-').replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (!line.replace(/[-_\s]/g, '')) continue;
    bucket.push(line);
    if (bucket.join(' ').length >= 30) flush();
  }
  flush();
  return result.length > 0 ? result : ['暂无详细处理记录，请补充分析。'];
}

const ERROR_ANALYSIS_TEXT: Record<'type1' | 'type2' | 'type3', string> = {
  type1: [
    '【Type1 - 恒定差额错误】',
    '分析原因：6月1日起总账户与分户合计差额恒定，业务期间分户/总账同步变动。该总分不平发生在6月1日之前，建议您往6月1日前追溯原因。',
    '判断标准：',
    '1. 该组(org_num, sbj_num, ccy)在查询期间内所有日期都有记录',
    '2. 所有日期的 tot_mint_dif 值完全相同（恒定差额）',
    '3. 说明：可能存在系统性的余额计算错误或初始余额设置问题',
  ].join('\n'),
  type2: [
    '【Type2 - 差额变化错误】',
    '分析原因：6月1日起总账户与分户合计产生差额不固定，业务期间分户/总账不同步变动。该总分不平发生在6月1日之前，同时中间又发生了新的错误，建议您对该账户的相关情况进行具体分析。',
    '判断标准：',
    '4. 在查询期间内，该组的 tot_mint_dif 值发生了至少一次变化',
    '5. 存在多个不同的差额值（change_list 长度 ≥ 2）',
    '6. 说明：可能在特定日期发生了交易或调整，导致差额发生变化',
  ].join('\n'),
  type3: [
    '【Type3 - 差额归零错误】',
    '分析原因：账户部分天数总分平衡，部分天数总分不平。建议借助平衡法则“当天余额=上一天余额±借方发生额±贷方发生额”进行计算找到错误',
    '判断标准：',
    '7. 该组在查询期间内不是所有日期都有记录（非全量）',
    '8. 不平记录数少于总天数，但大于0',
    '9. 存在一个日期范围（zero_span），在这个范围内差额从非零变为零',
    '10. 说明：可能在某段时间内发生了错误，之后被纠正或自动归零',
  ].join('\n'),
};

const normalizeErrorTypeKey = (type?: string | null): keyof typeof ERROR_ANALYSIS_TEXT | null => {
  if (!type) return null;
  const normalized = String(type).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.startsWith('type1')) return 'type1';
  if (normalized.startsWith('type2')) return 'type2';
  if (normalized.startsWith('type3')) return 'type3';
  return null;
};

const buildErrorAnalysisReport = (type?: string | null): string => {
  const key = normalizeErrorTypeKey(type);
  if (!key) return '';
  return ERROR_ANALYSIS_TEXT[key];
};
function buildMermaidFlowchartFromSteps(steps: string[]) {
  if (!steps.length) return '';
  const sanitize = (text: string) =>
    text
      .replace(/[\[\]]/g, '')
      .replace(/"/g, "'")
      .replace(/\s+/g, ' ')
      .slice(0, 80);
  const nodes = steps.map((step, idx) => `  s${idx}["${sanitize(step)}"]`);
  const edges = steps.slice(1).map((_, idx) => `  s${idx} --> s${idx + 1}`);
  const classLine = `  class ${steps.map((_, idx) => `s${idx}`).join(',')} step`;
  return ['flowchart TD', '  classDef step fill:#ecfdf5,stroke:#34d399,stroke-width:1px', ...nodes, ...edges, classLine].join('\n');
}
function buildFinAgentLogs(result: any): string[] {
  if (!result) return [];
  const analysisReport = buildErrorAnalysisReport(result?.type);
  if (Array.isArray(result.message_lines) && result.message_lines.length) {
    const chunks = buildLogChunks(result.message_lines as string[]);
    if (analysisReport) {
      chunks.push('');
      chunks.push(analysisReport);
    }
    return chunks;
  }
  if (Array.isArray(result.log_lines) && result.log_lines.length) {
    const chunks = buildLogChunks(result.log_lines);
    if (analysisReport) {
      chunks.push('');
      chunks.push(analysisReport);
    }
    return chunks;
  }
  const lines: string[] = [];
  lines.push(`机构 ${result.org_num ?? '-'} 科目 ${result.sbj_num ?? '-'} 币种 ${result.ccy ?? '-'} 日期 ${result.acg_dt ?? '-'}`);
  if (result.type) lines.push(`分类: ${result.type}`);
  if (result.history_total_diff !== undefined) lines.push(`History 差额: ${result.history_total_diff}`);
  if (result.individual_total_diff !== undefined) lines.push(`Individual 差额: ${result.individual_total_diff}`);
  if (typeof result.account_inconsistent_count === 'number') lines.push(`不一致账户数: ${result.account_inconsistent_count}`);
  if (Array.isArray(result.change_list) && result.change_list.length) lines.push(`差额序列: ${result.change_list.join(' -> ')}`);
  if (Array.isArray(result.change_dates) && result.change_dates.length) lines.push(`变化日期: ${result.change_dates.join(', ')}`);
  if (result.zero_span?.start || result.zero_span?.end) lines.push(`异常区间: ${result.zero_span?.start ?? '?'} ~ ${result.zero_span?.end ?? '?'}`);
  if (result.red_blue_cancellations?.summary?.note) lines.push(`冲销检查: ${result.red_blue_cancellations.summary.note}`);
  const chunks = buildLogChunks(lines);
  if (analysisReport) {
    chunks.push('');
    chunks.push(analysisReport);
  }
  return chunks;
}
