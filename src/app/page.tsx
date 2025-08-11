'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  PlusCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  DollarSign,
  Download,
  LogOut,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/stores/useStore'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

// 动态导入重型组件
const TransactionForm = dynamic(() => import('@/components/TransactionForm'), {
  loading: () => <div className="animate-pulse">加载中...</div>,
})

const TransactionList = dynamic(() => import('@/components/TransactionList'), {
  loading: () => <div className="animate-pulse">加载交易记录...</div>,
})

const CategoryManager = dynamic(() => import('@/components/CategoryManager'), {
  loading: () => <div className="animate-pulse">加载分类管理...</div>,
  ssr: false,
})

const BudgetManager = dynamic(() => import('@/components/BudgetManager'), {
  loading: () => <div className="animate-pulse">加载预算管理...</div>,
  ssr: false,
})

const Statistics = dynamic(() => import('@/components/Statistics'), {
  loading: () => <div className="animate-pulse">加载统计图表...</div>,
  ssr: false,
})

const ExportData = dynamic(() => import('@/components/ExportData'), {
  loading: () => <div className="animate-pulse">加载导出功能...</div>,
  ssr: false,
})

const BudgetAlerts = dynamic(() => import('@/components/BudgetAlerts'), {
  loading: () => null,
  ssr: false,
})

// 加载状态组件
const TabLoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

export default function Home() {
  const [activeTab, setActiveTab] = useState('transactions')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const { transactions, setTransactions, setCategories, setBudgets } = useStore()
  const { user, signOut } = useAuth()
  const supabase = createClient()

  // 使用 useMemo 缓存计算结果
  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), [])
  
  const monthlyTransactions = useMemo(() => 
    transactions.filter(t => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  )
  
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    }
  }, [monthlyTransactions])

  // 加载数据
  const loadData = async () => {
    try {
      // 检查 Supabase 是否正确初始化
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Supabase 环境变量未配置')
        return
      }

      if (!user) {
        console.log('等待用户登录')
        return
      }

      // 并行加载所有数据
      const [categoriesResponse, transactionsResponse, budgetsResponse] = await Promise.all([
        // 加载用户的分类（包括用户自己的和公共的）
        supabase
          .from('categories')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('name'),
        
        // 只加载当前用户的交易记录
        supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        
        // 只加载当前用户的预算
        supabase
          .from('budgets')
          .select('*, category:categories(*)')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
      ])
      
      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data)
      }
      
      if (transactionsResponse.data) {
        setTransactions(transactionsResponse.data)
      }
      
      if (budgetsResponse.data) {
        setBudgets(budgetsResponse.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
              {user && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
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

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 预算提醒 - 懒加载 */}
        <Suspense fallback={null}>
          <BudgetAlerts />
        </Suspense>
        
        {/* 统计卡片 */}
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

        {/* 内容区域 - 使用 Suspense 包裹动态组件 */}
        <div className="mt-6">
          <Suspense fallback={<TabLoadingState />}>
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
          </Suspense>
        </div>
      </div>

      {/* 添加交易弹窗 - 懒加载 */}
      {showTransactionForm && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>}>
          <TransactionForm
            onClose={() => setShowTransactionForm(false)}
            onSuccess={() => {
              setShowTransactionForm(false)
              loadData()
            }}
          />
        </Suspense>
      )}
    </div>
  )
}