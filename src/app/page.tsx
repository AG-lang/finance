'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  PlusCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TransactionForm from '@/components/TransactionForm'
import TransactionList from '@/components/TransactionList'
import CategoryManager from '@/components/CategoryManager'
import BudgetManager from '@/components/BudgetManager'
import Statistics from '@/components/Statistics'
import ExportData from '@/components/ExportData'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [activeTab, setActiveTab] = useState('transactions')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const { transactions, setTransactions, setCategories, setBudgets } = useStore()

  // 计算统计数据
  const currentMonth = format(new Date(), 'yyyy-MM')
  const monthlyTransactions = transactions.filter(t => 
    t.date.startsWith(currentMonth)
  )
  
  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpense

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 加载分类
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (categoriesData) {
        setCategories(categoriesData)
      }

      // 加载交易记录
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .order('date', { ascending: false })
      
      if (transactionsData) {
        setTransactions(transactionsData)
      }

      // 加载预算
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('month', currentMonth)
      
      if (budgetsData) {
        setBudgets(budgetsData)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const tabs = [
    { id: 'transactions', label: '收支记录', icon: Wallet },
    { id: 'statistics', label: '数据统计', icon: BarChart3 },
    { id: 'categories', label: '分类管理', icon: PieChart },
    { id: 'budget', label: '预算管理', icon: DollarSign },
    { id: 'export', label: '数据导出', icon: Download },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">个人记账</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {format(new Date(), 'yyyy年MM月dd日', { locale: zhCN })}
              </span>
              <Button
                onClick={() => setShowTransactionForm(true)}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                记一笔
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥{totalIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月支出</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ¥{totalExpense.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月结余</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ¥{balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标签页导航 */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="mt-6">
          {activeTab === 'transactions' && (
            <TransactionList 
              transactions={monthlyTransactions}
              onRefresh={loadData}
            />
          )}
          {activeTab === 'statistics' && (
            <Statistics transactions={transactions} />
          )}
          {activeTab === 'categories' && (
            <CategoryManager />
          )}
          {activeTab === 'budget' && (
            <BudgetManager />
          )}
          {activeTab === 'export' && (
            <ExportData />
          )}
        </div>
      </div>

      {/* 添加交易弹窗 */}
      {showTransactionForm && (
        <TransactionForm
          onClose={() => setShowTransactionForm(false)}
          onSuccess={() => {
            setShowTransactionForm(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}