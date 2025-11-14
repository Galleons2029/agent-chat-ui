'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  BarChart2,
  MessageSquare,
  Search,
  BadgeAlert,
  Bell,
  User,
  Home,
  Bot,
  Database,
  FileText,
  Settings,
  GitBranch,
} from 'lucide-react';
import { rawData, suggestionMap, buildFallbackSteps, mermaidData } from '@/app/account/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

const mappedRows: Row[] = rawData.map((d, i) => {
  const gnl = Number(d.gnl_ldgr_bal);
  const sbact = Number(d.sbact_acct_bal);
  const diff = Number((d.tot_mint_dif || '0').toString().replace(/\s+/g, ''));
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
    status: '待处理',
    owner: '张会计',
    risk: '中风险',
    sbactStr: d.sbact_acct_bal,
    gnlStr: d.gnl_ldgr_bal,
    diffStr: d.tot_mint_dif,
  };
});

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
  const toRisk = (amt: number) => (amt > 100000 ? '高风险' : amt > 1000 ? '中风险' : '低风险');
  return Array.from(map.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([ccy, v]) => ({ ccy, amount: v.amount, count: v.count, risk: toRisk(v.amount) }));
})();

export type AccountPanelVariant = 'page' | 'dashboard';

type AccountPanelProps = {
  variant?: AccountPanelVariant;
};

export function AccountPanel({ variant = 'page' }: AccountPanelProps) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

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
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <SummaryCard title="待处理" value={`${filtered.length}`} icon={<BadgeAlert className="text-amber-500" size={20} />} />
        <SummaryCard
          title="高风险币种"
          value={`${currencySummary.filter((c) => c.risk === '高风险').length}`}
          icon={<AlertTriangle className="text-red-500" size={20} />}
        />
        <SummaryCard title="已解决" value="0" icon={<CheckCircle2 className="text-emerald-500" size={20} />} />
        <SummaryCard title="差异总额" value={`¥${formatMoney(sumAbs(mappedRows.map((r) => r.amount)))}`} icon={<CircleDollarSign className="text-emerald-600" size={20} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>差异明细（{filtered.length}）</CardTitle>
              <CardDescription>按机构号、科目与币种查看总分不平</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <SearchInput value={query} onChange={setQuery} className="w-full sm:w-64 lg:w-72" />
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-y text-muted-foreground">
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
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                      <Td>{r.org}</Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.subjectNo}</span>
                        </div>
                      </Td>
                      <Td>
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600">{r.ccy}</span>
                      </Td>
                      <Td className="text-right">
                        <span className={`${r.sbact >= 0 ? 'text-red-500' : 'text-emerald-600'} font-semibold`}>
                          {r.sbact >= 0 ? '+' : '-'}
                          {formatMoney(Math.abs(r.sbact))}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <span className={`${r.gnl >= 0 ? 'text-red-500' : 'text-emerald-600'} font-semibold`}>
                          {r.gnl >= 0 ? '+' : '-'}
                          {formatMoney(Math.abs(r.gnl))}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <span className={`${r.amount >= 0 ? 'text-red-500' : 'text-emerald-600'} font-semibold`}>
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
                        <Dialog open={openId === r.id} onOpenChange={(o) => setOpenId(o ? r.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="link" className="h-auto p-0 text-emerald-600">
                              详情
                            </Button>
                          </DialogTrigger>
                          <FullDetailDialog row={r} />
                        </Dialog>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-gray-500">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">币种统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currencySummary.map((c) => (
              <div key={c.ccy} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm font-semibold">{c.ccy}</div>
                  <div className="text-sm">
                    <div className="font-medium">{c.ccy}</div>
                    <div className="text-muted-foreground">科目数 {c.count}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">¥{formatMoney(c.amount)}</div>
                  <RiskPill risk={c.risk as any} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );

  if (variant === 'dashboard') {
    return <section className="space-y-6">{panelBody}</section>;
  }


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

function SummaryCard({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">{icon}</div>
      </div>
    </Card>
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

function FullDetailDialog({ row }: { row: Row }) {
  const sbact = row.sbact;
  const gnl = row.gnl;
  const diff = row.amount;
  const org = row.org;
  const sbj = row.subjectNo;
  const ccy = row.ccy;
  const dt = row.dt;

  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const suggestionKeyWithDate = `${org}|${sbj}|${ccy}|${dt}`;
  const suggestionKey = `${org}|${sbj}|${ccy}`;
  useEffect(() => {
    setLogs([]);
    setMermaidChart(null);
    setProcessing(false);
  }, [row.id]);
  const steps = useMemo(
    () => suggestionMap[suggestionKeyWithDate] ?? suggestionMap[suggestionKey] ?? buildFallbackSteps(org, sbj, ccy, dt),
    [suggestionKeyWithDate, suggestionKey, org, sbj, ccy, dt],
  );
  const resolvedMermaidChart = useMemo(
    () => mermaidData[suggestionKeyWithDate] ?? mermaidData[suggestionKey] ?? mermaidData.default ?? buildMermaidFlowchartFromSteps(steps),
    [suggestionKeyWithDate, suggestionKey, steps],
  );

  const startProcessing = () => {
    if (processing) return;
    setProcessing(true);
    setLogs([]);
    const chunkedSteps = buildLogChunks(steps);
    let i = 0;
    const timer = window.setInterval(() => {
      setLogs((prev) => [...prev, chunkedSteps[i]]);
      i += 1;
      if (i >= chunkedSteps.length) {
        window.clearInterval(timer);
        setProcessing(false);
      }
    }, 600);
  };

  const handleGenerateFlowchart = () => {
    setMermaidChart(resolvedMermaidChart);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  return (
    <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
      <DialogHeader>
        <DialogTitle>差异详情</DialogTitle>
        <DialogDescription>
          机构 {org} · 科目 {sbj} · {ccy} · {dt}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
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
              <InfoRow label="机构号" value={org} />
              <InfoRow label="科目编号" value={sbj} />
              <InfoRow label="币种" value={ccy} />
              <InfoRow label="账期" value={dt} />
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/60 shadow-inner ring-1 ring-emerald-50">
            <div className="flex items-center justify-between border-b border-emerald-100 bg-white/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <GitBranch size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">流程图处理</p>
                  <p className="text-xs text-emerald-600">点击“生成流程图”查看差异具体处理路径</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                onClick={handleGenerateFlowchart}
              >
                {mermaidChart ? '重新生成' : '生成流程图'}
              </Button>
            </div>
            <div className="p-4">
              {mermaidChart ? (
                <MermaidDiagram chart={mermaidChart} className="bg-white" />
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-white/80 px-4 text-center text-sm text-muted-foreground">
                  <p>流程图会基于当前机构、科目与币种的历史经验生成。</p>
                  <p className="mt-2 text-xs text-emerald-700">点击上方按钮快速预览处理步骤</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex h-[360px] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/70 shadow-inner">
            <div className="flex items-center justify-between border-b border-emerald-100 bg-white/80 p-4">
              <div>
                <p className="text-sm font-semibold text-emerald-900">AI处理助手</p>
                <p className="text-xs text-emerald-600">点击“开始处理”后生成建议记录，包含具体的详细数据分析流动</p>
              </div>
              <span className={`text-xs font-medium ${processing ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`}>
                {processing ? '执行中…' : '待启动'}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-white/70 px-4 py-3 scrollbar-thin" ref={logRef}>
              {logs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <MessageSquare className="mb-3 text-emerald-400" size={28} />
                  <p>点击“开始处理”后，这里会以聊天形式展示每一步数据流动分析。</p>
                </div>
              ) : (
                logs.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <Bot size={16} />
                    </div>
                    <div className="max-w-[85%] rounded-2xl bg-white px-4 py-2 text-sm text-gray-800 shadow ring-1 ring-emerald-100">{line}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-emerald-100 bg-white/90 p-4">
              <DialogClose asChild>
                <Button variant="outline">关闭</Button>
              </DialogClose>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={startProcessing} disabled={processing}>
                {processing ? '处理中…' : '开始处理'}
              </Button>
            </div>
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
    const line = raw.trim();
    if (!line) continue;
    if (!line.replace(/[-—_\s]/g, '')) continue;
    bucket.push(line);
    if (bucket.join(' ').length >= 30) flush();
  }
  flush();
  return result.length > 0 ? result : ['暂无详细处理记录，请补充分析。'];
}
function buildMermaidFlowchartFromSteps(steps: string[]) {
  if (!steps.length) return mermaidData.default;
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

