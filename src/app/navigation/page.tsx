import Link from 'next/link';
import { BarChart3, MessageCircle, BookOpen, Database, ArrowRight } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';

const shortcuts = [
  {
    title: '智能对话',
    description: '与财枢智擎协同处理业务、解答疑问',
    href: '/chat',
    icon: MessageCircle,
  },
  {
    title: '知识课堂',
    description: '系统化学习内部培训课程，跟踪进度',
    href: '/about',
    icon: BookOpen,
  },
  {
    title: '数据面板',
    description: '查看关键运营指标，掌握整体态势',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    title: '账户检索',
    description: '快速定位账务异常，支持自然语言查询',
    href: '/reports',
    icon: Database,
  },
];

export default function NavigationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <header className="bg-white/80 backdrop-blur border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandMark glow={false} className="text-sm tracking-[0.4em]" />
            <h1 className="text-3xl font-semibold text-gray-900 mt-1">智能协同导航中心</h1>
            <p className="text-gray-500 mt-2">统一入口连接培训、财务分析与智能助理，一次登录即可触达所有能力。</p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-white font-medium shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
          >
            进入对话
            <ArrowRight size={18} />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <section className="grid gap-6 md:grid-cols-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.title}
                href={shortcut.href}
                className="group rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-sm shadow-emerald-100 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-emerald-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shortcut.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{shortcut.description}</p>
                  </div>
                </div>
                <div className="mt-6 inline-flex items-center text-sm font-medium text-emerald-600">
                  立即前往
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white/80 px-8 py-10 shadow-sm shadow-emerald-100 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-500">实时洞察</p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-3">关键运营指标</h2>
            <p className="text-gray-500 mt-4 leading-relaxed">
              汇总培训进度、财务预警和知识库访问情况，帮助你快速了解运营现状，及时发现风险信号。
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { label: '新员工培训完成率', value: '87%' },
              { label: '财务异常待处理', value: '3条' },
              { label: '知识库日均访问', value: '256 次' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-emerald-50 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">
        <p>苏州银行股份有限公司版权所有 · 苏ICP备10208567号-2 · 本网站支持 IPv6</p>
      </footer>
    </div>
  );
}
