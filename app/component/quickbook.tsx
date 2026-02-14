'use client';
import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Users,
  CreditCard,
  Building,
  BarChart3,
  Calendar,
  Download,
  Plus,
  MoreHorizontal,
  Bell,
  Settings,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  Wallet,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Business from '../business/businessbtn';

const Dashboard: React.FC = ({logo,business_name}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold text-gray-900">QuickBiz</span>
              </div>
              <nav className="flex items-center space-x-6">
                {['Dashboard', 'Transactions', 'Invoices', 'Reports', 'Taxes', 'Accounting'].map((item) => (
                  <a key={item} href="#" className={`text-sm font-medium ${
                    item === 'Dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                    {item}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Search size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Bell size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings size={20} />
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{business_name}</h2>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>

            <nav className="space-y-2">
              {[
                { icon: BarChart3, label: 'Overview', active: true },
                { icon: DollarSign, label: 'Sales' },
                { icon: CreditCard, label: 'Expenses' },
                { icon: FileText, label: 'Invoices' },
                { icon: Users, label: 'Customers' },
                { icon: Wallet, label: 'Banking' },
                { icon: PieChart, label: 'Reports' },
                { icon: Activity, label: 'Taxes' },
              ].map((item, index) => (
                <a
                  key={item.label}
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    item.active 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tools
              </h3>
              <nav className="space-y-2">
                {['Mileage Tracking', 'Receipt Capture', 'Time Tracking', 'Estimates'].map((item) => (
                  <a key={item} href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>{item}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your business overview.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Calendar size={18} />
                <span>This Month</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={18} />
                <span>New Transaction</span>
              </button>
            </div>
          </div>

          {/* Profit & Loss Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Profit and Loss</h2>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm">
                  <Download size={16} />
                  <span>Export</span>
                </button>
                <button className="p-1.5 text-gray-600 hover:text-gray-900">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Income</span>
                  <ArrowUpRight className="text-green-600" size={16} />
                </div>
                <p className="text-2xl font-bold text-gray-900">$45,231</p>
                <p className="text-sm text-green-600">+12.4% from last month</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Expenses</span>
                  <ArrowDownRight className="text-red-600" size={16} />
                </div>
                <p className="text-2xl font-bold text-gray-900">$32,184</p>
                <p className="text-sm text-red-600">+8.2% from last month</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Net Income</span>
                  <TrendingUp className="text-green-600" size={16} />
                </div>
                <p className="text-2xl font-bold text-gray-900">$13,047</p>
                <p className="text-sm text-green-600">+24.1% from last month</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Profit Margin</span>
                  <Target className="text-blue-600" size={16} />
                </div>
                <p className="text-2xl font-bold text-gray-900">28.8%</p>
                <p className="text-sm text-green-600">+2.4% from last month</p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="text-gray-400 mx-auto mb-2" size={32} />
                <p className="text-gray-500">Profit and Loss Trend Chart</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Invoices & Bills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Money In</h3>
                    <span className="text-sm text-green-600 font-semibold">$12,450</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Awaiting Payment', value: '$8,240', count: 12, status: 'warning' },
                      { label: 'Overdue', value: '$2,180', count: 5, status: 'error' },
                      { label: 'Paid This Month', value: '$22,030', count: 28, status: 'success' },
                    ].map((item, index) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'success' ? 'bg-green-500' :
                            item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                          <p className="text-xs text-gray-500">{item.count} invoices</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                    View All Invoices
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Money Out</h3>
                    <span className="text-sm text-red-600 font-semibold">$8,420</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'To Be Paid', value: '$3,150', count: 8, status: 'warning' },
                      { label: 'Overdue', value: '$1,270', count: 3, status: 'error' },
                      { label: 'Paid This Month', value: '$15,840', count: 22, status: 'success' },
                    ].map((item, index) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'success' ? 'bg-green-500' :
                            item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                          <p className="text-xs text-gray-500">{item.count} bills</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                    View All Bills
                  </button>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { type: 'Income', description: 'Website Design Project', amount: '$4,500', date: 'Today', status: 'completed' },
                    { type: 'Expense', description: 'Office Supplies', amount: '$342.50', date: 'Today', status: 'completed' },
                    { type: 'Income', description: 'Monthly Retainer', amount: '$2,000', date: 'Yesterday', status: 'completed' },
                    { type: 'Expense', description: 'Software Subscription', amount: '$299.99', date: '2 days ago', status: 'completed' },
                  ].map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'Income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'Income' ? 
                            <TrendingUp className="text-green-600" size={16} /> :
                            <TrendingDown className="text-red-600" size={16} />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'Income' ? '+' : '-'}{transaction.amount}
                        </p>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <CheckCircle2 size={14} className="text-green-500" />
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Business Snapshot */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Business Snapshot</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Customers</span>
                    <span className="font-semibold text-gray-900">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Open Invoices</span>
                    <span className="font-semibold text-gray-900">17</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unpaid Bills</span>
                    <span className="font-semibold text-gray-900">11</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bank Accounts</span>
                    <span className="font-semibold text-gray-900">3</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Business />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Plus, label: 'Create Invoice', color: 'blue' },
                    { icon: Users, label: 'Add Customer', color: 'green' },
                    { icon: CreditCard, label: 'Record Expense', color: 'red' },
                    { icon: Download, label: 'Export Report', color: 'purple' },
                  ].map((action, index) => (
                    <button
                      key={action.label}
                      className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-${action.color}-100 flex items-center justify-center mb-2`}>
                        <action.icon className={`text-${action.color}-600`} size={16} />
                      </div>
                      <span className="text-xs text-gray-700 text-center">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Watchlist */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Account Watchlist</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Business Checking', balance: '$23,458.90', alert: 'low' },
                    { name: 'Business Savings', balance: '$45,200.00', alert: null },
                    { name: 'Credit Card', balance: '$2,458.32', alert: 'high' },
                  ].map((account, index) => (
                    <div key={account.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{account.name}</p>
                        <p className="text-sm text-gray-500">{account.balance}</p>
                      </div>
                      {account.alert && (
                        <AlertCircle 
                          size={16} 
                          className={account.alert === 'low' ? 'text-yellow-500' : 'text-red-500'} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;