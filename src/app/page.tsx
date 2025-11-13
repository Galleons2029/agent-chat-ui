'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Brain, Database, MessageCircle, BookOpen, CheckCircle, Star, Play, Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';

type LogoIconProps = {
  size?: number;
  className?: string;
};

const LogoIcon = ({ size = 32, className }: LogoIconProps) => (
  <Image
    src="/logo.svg"
    alt="财枢智擎 Logo"
    width={size}
    height={size}
    className={`object-contain ${className ?? ''}`.trim()}
  />
);

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "AI 教师辅助",
      description: "智能引导新员工学习行内知识和银行内部培训手册，个性化教学路径",
      details: "基于银行内部知识库，为新员工提供定制化学习路径。AI 教师能够根据员工的学习进度和理解能力，动态调整教学内容和难度，确保每位员工都能高效掌握所需知识。"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "智能课程测试",
      description: "根据学习进度自动设计测试题，实时评估学习效果",
      details: "系统会根据员工的学习进度和掌握情况，自动生成相应的测试题目。测试内容覆盖已学知识点，帮助员工巩固所学内容，并为管理者提供学习效果的实时反馈。"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "账户分析查询",
      description: "自助查询数据库，快速定位总账总分不平的原因",
      details: "通过自然语言查询，员工可以快速获取账户信息和财务数据。系统能智能分析总账与明细账之间的差异，自动定位不平衡的原因，大幅提升财务分析效率。"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "超强记忆模块",
      description: "支持超长多轮对话，保持上下文连贯性",
      details: "先进的记忆机制让财枢智擎能够在长时间对话中保持上下文连贯性。无论对话多复杂，系统都能记住关键信息，提供连贯、准确的响应。"
    }
  ];

  const heroStats = [
    { label: '新员工培训进度', value: '85%' },
    { label: '待处理财务查询', value: '3' },
    { label: '知识库访问', value: '247次' },
  ];

  const benefits = [
    {
      title: "智能培训",
      description: "个性化学习路径，AI教师实时指导，大幅提升新员工培训效率",
      icon: <BookOpen className="w-8 h-8" />,
    },
    {
      title: "财务分析",
      description: "快速查询和分析财务数据，智能定位问题根源",
      icon: <Database className="w-8 h-8" />,
    },
    {
      title: "长期记忆",
      description: "支持超长多轮对话，保持上下文连贯性",
      icon: <MessageCircle className="w-8 h-8" />,
    },
    {
      title: "实时测试",
      description: "根据学习进度自动生成测试，实时评估学习效果",
      icon: <LogoIcon size={32} />,
    },
    {
      title: "知识管理",
      description: "集中管理银行内部知识，随时检索所需信息",
      icon: <CheckCircle className="w-8 h-8" />,
    },
    {
      title: "效率提升",
      description: "自动化处理重复性工作，让员工专注核心业务",
      icon: <Star className="w-8 h-8" />,
    },
  ];

  const testimonials = [
    { name: "张经理", role: "培训部主管", content: "财枢智擎让新员工培训周期缩短了 40%，学习效果显著提升。" },
    { name: "李会计", role: "财务分析师", content: "账户分析功能帮我快速解决了困扰已久的总账不平衡问题。" },
    { name: "王主任", role: "IT部门", content: "系统的稳定性和智能程度超出了我们的预期，强烈推荐。" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3 rounded-full border border-emerald-50/80 bg-white/95 px-3.5 py-1.5 pr-5 shadow-[0_12px_25px_rgba(16,185,129,0.08)] backdrop-blur">
                <div className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 w-10 h-10 rounded-2xl flex items-center justify-center shadow-[inset_0_-1px_4px_rgba(255,255,255,0.6)]">
                  <LogoIcon size={24} className="drop-shadow-[0_1px_4px_rgba(16,185,129,0.25)]" />
                </div>
                <BrandMark className="text-xl md:text-2xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <Link href="#features" className="text-gray-700 hover:text-green-600 transition-colors">核心功能</Link>
                <Link href="#demo" className="text-gray-700 hover:text-green-600 transition-colors">对话演示</Link>
                <Link href="#benefits" className="text-gray-700 hover:text-green-600 transition-colors">产品优势</Link>
                <Link href="#testimonials" className="text-gray-700 hover:text-green-600 transition-colors">用户评价</Link>
                <Link
                  href="/login"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  免费试用
                </Link>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-green-600"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="#features" className="block px-3 py-2 text-gray-700 hover:text-green-600">核心功能</Link>
              <Link href="#demo" className="block px-3 py-2 text-gray-700 hover:text-green-600">对话演示</Link>
              <Link href="#benefits" className="block px-3 py-2 text-gray-700 hover:text-green-600">产品优势</Link>
              <Link href="#testimonials" className="block px-3 py-2 text-gray-700 hover:text-green-600">用户评价</Link>
              <Link
                href="/login"
                className="block w-full text-left bg-green-600 text-white px-3 py-2 rounded-lg mt-2"
              >
                免费试用
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 头部英雄区域 */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <BrandMark className="block text-4xl md:text-5xl lg:text-6xl leading-tight" />
                <span className="block text-green-600">银行智能助手</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                专为银行内部员工设计的AI助手，提供智能培训、财务分析和知识管理服务，
                帮助您的团队提升效率，降低培训成本。
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg text-center"
                >
                  开始免费试用
                </Link>
                <button className="flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors">
                  <Play className="w-5 h-5 mr-2" />
                  观看演示
                </button>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-gray-600">培训效率提升</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">40%</div>
                  <div className="text-gray-600">培训周期缩短</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">99%</div>
                  <div className="text-gray-600">准确率</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                  <div className="flex items-center mb-4">
                    <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                      <LogoIcon size={24} />
                    </div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <BrandMark className="text-2xl" glow={false} />
                      <span className="text-white/90">智能助手</span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {heroStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex justify-between items-center rounded-2xl border border-white/10 bg-gradient-to-r from-white/15 to-white/5 px-4 py-3 text-white transition-colors duration-300 hover:from-white/25 hover:to-white/10"
                      >
                        <span className="text-sm sm:text-base font-medium tracking-wide">
                          {stat.label}
                        </span>
                        <span className="text-lg font-semibold">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能区域 */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              核心功能
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              <BrandMark glow={false} className="text-2xl mr-2" />
              {' '}
              集成了四大核心功能，全方位提升银行内部工作效率
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeFeature === index
                      ? 'bg-green-50 border-2 border-green-200 shadow-lg'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      activeFeature === index ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
                  {features[activeFeature].icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {features[activeFeature].title}
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                  {features[activeFeature].details}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 对话演示区域 */}
      <section id="demo" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              对话演示
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              体验
              {' '}
              <BrandMark glow={false} className="text-2xl mx-1" />
              {' '}
              的智能对话能力，感受自然语言交互的便捷
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                  <LogoIcon size={16} />
                </div>
                <BrandMark glow={false} className="text-lg" />
              </div>
              <div className="space-y-3">
                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-gray-800">
                    您好！我是
                    {' '}
                    <BrandMark glow={false} className="text-base mx-1" />
                    ，银行智能助手。我可以帮助您学习银行内部知识、解答财务问题，或进行账户分析。请告诉我您需要什么帮助？
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-800">你好，我想了解一下银行的贷款审批流程。</p>
                </div>
                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-gray-800">好的，银行贷款审批流程主要包括以下几个步骤：<br/>1. 客户申请：客户提供贷款申请及相关资料<br/>2. 资料审核：银行审核客户提供的资料完整性<br/>3. 信用评估：对客户进行信用评级<br/>4. 实地调查：必要时进行实地考察<br/>5. 审批决策：根据评估结果决定是否放款<br/>6. 合同签订：与客户签订贷款合同<br/>7. 贷款发放：按约定条件发放贷款</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-800">如果总账和明细账对不上，我该怎么查？</p>
                </div>
                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-gray-800">要查找总账与明细账不平衡的原因，您可以按以下步骤操作：<br/>1. 检查会计分录是否正确录入<br/>2. 核对科目余额是否一致<br/>3. 查看是否存在未过账的凭证<br/>4. 检查借贷方向是否正确<br/>5. 核对期初余额是否准确<br/>需要我帮您进一步分析具体账户吗？</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <span className="text-gray-600 mr-2">输入您的问题...</span>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse ml-1"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse ml-1"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 产品优势区域 */}
      <section id="benefits" className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              产品优势
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              <BrandMark glow={false} className="text-2xl mr-2" />
              {' '}
              为银行内部员工提供全方位的智能支持
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/15 via-white/10 to-white/5 p-6 text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:from-white/25 hover:via-white/15 hover:to-white/10"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-600 shadow-inner">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-semibold">{benefit.title}</h3>
                </div>
                <p className="mt-4 text-lg text-emerald-50/90">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 用户评价区域 */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              用户评价
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              来自银行内部员工的真实反馈
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-green-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 flex flex-wrap items-center justify-center gap-2">
            <span>立即体验</span>
            <BrandMark className="text-4xl" />
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            加入数千家银行的选择，提升您的团队效率和培训效果
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              免费试用 14 天
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
              联系销售
            </button>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-green-600 w-8 h-8 rounded-lg flex items-center justify-center mr-2">
                  <LogoIcon size={20} />
                </div>
                <BrandMark className="text-xl" />
              </div>
              <p className="text-gray-400">
                专为银行内部员工设计的AI助手，提升培训效率，优化财务管理。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">产品</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">核心功能</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">对话演示</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">定价方案</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">免费试用</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">支持</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">帮助中心</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">文档</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">联系我们</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">公司</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">关于我们</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">新闻</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">招聘</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025
              {' '}
              <BrandMark glow={false} className="text-base mx-1" />
              . 保留所有权利。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
