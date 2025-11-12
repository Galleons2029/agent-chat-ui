'use client';

import { useState } from 'react';
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
import { type LucideIcon, Home, Bot, Database, FileText, BarChart2, Settings, Bell, User } from 'lucide-react';

type NavigationItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: '数据看板', icon: Home, color: 'bg-green-500' },
  { id: 'ai', label: '智能AI问答', icon: Bot, color: 'bg-blue-500' },
  { id: 'knowledge', label: '知识库', icon: Database, color: 'bg-purple-500' },
  { id: 'accounts', label: '账户查询', icon: FileText, color: 'bg-amber-500' },
  { id: 'analysis', label: '数据分析', icon: BarChart2, color: 'bg-teal-500' },
  { id: 'settings', label: '系统设置', icon: Settings, color: 'bg-gray-500' },
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

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState<NavigationItem['id']>('dashboard');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">银行会计系统</h1>
              <p className="text-xs text-gray-500">Internal Accounting System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeMenu === item.id
                      ? `${item.color} text-white`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">张会计</p>
              <p className="text-xs text-gray-500">会计主管</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">数据看板</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="全局搜索..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <Bell size={20} className="text-gray-600 cursor-pointer" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <span className="text-gray-800">张会计</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Account Balance */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">总账户余额</p>
                  <p className="text-2xl font-bold text-gray-800">¥7,049,371.25</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8v6h-8v-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 13h8v6h-8v-6z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Monthly Income */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">本月收入</p>
                  <p className="text-2xl font-bold text-gray-800">¥45,678.90</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Accounts */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">活跃账户</p>
                  <p className="text-2xl font-bold text-gray-800">12</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9M5 11V9m2 2a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">待处理事务</p>
                  <p className="text-2xl font-bold text-gray-800">8</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7m2-2h10V7m-2 2a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2a2 2 0 002 2h10z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income/Expense Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">月度收支趋势</h2>
              <div className="h-80">
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
                        <span style={{ color: value === '支出' ? '#ef4444' : '#10b981' }}>
                          {value}
                        </span>
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
              </div>
            </div>

            {/* Account Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">账户分布</h2>
              <div className="h-80 flex items-center justify-center">
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
                        <Cell
                          key={`cell-${index}`}
                          fill={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
                        />
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
