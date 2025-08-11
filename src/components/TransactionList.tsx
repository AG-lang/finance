'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Edit2, Trash2, Search, Filter, ChevronDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Transaction } from '@/types'
import { createClient } from '@/utils/supabase/client'
import { useStore } from '@/stores/useStore'
import dynamic from 'next/dynamic'

// 动态导入 TransactionForm 以减少初始加载
const TransactionForm = dynamic(() => import('./TransactionForm'), {
  loading: () => <div className="animate-pulse">加载中...</div>,
})

interface TransactionListProps {
  transactions: Transaction[]
  onRefresh: () => void
}

// 单个交易项组件 - 使用 memo 优化
const TransactionItem = memo(({ 
  transaction, 
  onEdit, 
  onDelete, 
  isDeleting 
}: {
  transaction: Transaction
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}) => {
  const categoryColor = transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${categoryColor}`}>
              {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {transaction.category?.name || '未分类'}
            </span>
          </div>
          {transaction.description && (
            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(transaction.date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(transaction)}
            disabled={isDeleting}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(transaction.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
})

TransactionItem.displayName = 'TransactionItem'

// 过滤器组件 - 使用 memo 优化
const FilterPanel = memo(({ 
  filters, 
  categories, 
  onFilterChange 
}: {
  filters: any
  categories: any[]
  onFilterChange: (filters: any) => void
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日期范围</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="thisMonth">本月</option>
            <option value="lastMonth">上月</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        {filters.dateRange === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="income">收入</option>
            <option value="expense">支出</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select
            value={filters.categoryId}
            onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">最小金额</label>
          <input
            type="number"
            value={filters.minAmount}
            onChange={(e) => onFilterChange({ ...filters, minAmount: e.target.value })}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">最大金额</label>
          <input
            type="number"
            value={filters.maxAmount}
            onChange={(e) => onFilterChange({ ...filters, maxAmount: e.target.value })}
            placeholder="999999"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
})

FilterPanel.displayName = 'FilterPanel'

export default function TransactionList({ transactions, onRefresh }: TransactionListProps) {
  const { categories } = useStore()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: 'all' as 'all' | 'thisMonth' | 'lastMonth' | 'custom',
    startDate: '',
    endDate: '',
    type: 'all' as 'all' | 'income' | 'expense',
    categoryId: 'all',
    minAmount: '',
    maxAmount: ''
  })
  const [displayCount, setDisplayCount] = useState(20) // 虚拟滚动 - 初始显示20条
  const supabase = createClient()

  // 使用 useCallback 缓存函数
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return
    
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      onRefresh()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }, [supabase, onRefresh])

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction)
  }, [])

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
    setDisplayCount(20) // 重置显示数量
  }, [])

  // 使用 useMemo 缓存过滤结果
  const filteredTransactions = useMemo(() => {
    let result = transactions

    // 搜索过滤
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(transaction => {
        const matchDescription = transaction.description?.toLowerCase().includes(searchLower)
        const matchCategory = transaction.category?.name.toLowerCase().includes(searchLower)
        const matchAmount = transaction.amount.toString().includes(searchTerm)
        return matchDescription || matchCategory || matchAmount
      })
    }

    // 日期范围过滤
    if (filters.dateRange !== 'all') {
      result = result.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        if (filters.dateRange === 'thisMonth') {
          const now = new Date()
          const monthStart = startOfMonth(now)
          const monthEnd = endOfMonth(now)
          return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })
        } else if (filters.dateRange === 'lastMonth') {
          const now = new Date()
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
          const monthStart = startOfMonth(lastMonth)
          const monthEnd = endOfMonth(lastMonth)
          return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })
        } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
          const start = new Date(filters.startDate)
          const end = new Date(filters.endDate)
          return isWithinInterval(transactionDate, { start, end })
        }
        return true
      })
    }

    // 类型过滤
    if (filters.type !== 'all') {
      result = result.filter(t => t.type === filters.type)
    }

    // 分类过滤
    if (filters.categoryId !== 'all') {
      result = result.filter(t => t.category_id === filters.categoryId)
    }

    // 金额范围过滤
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount)
      result = result.filter(t => t.amount >= min)
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount)
      result = result.filter(t => t.amount <= max)
    }

    return result
  }, [transactions, searchTerm, filters])

  // 分组数据
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    
    filteredTransactions.forEach(transaction => {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, Math.ceil(displayCount / 5)) // 假设每天平均5条记录
  }, [filteredTransactions, displayCount])

  // 统计信息
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length
    }
  }, [filteredTransactions])

  // 加载更多
  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + 20)
  }, [])

  return (
    <div className="space-y-4">
      {/* 搜索和过滤栏 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="搜索交易记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          筛选
        </Button>
      </div>

      {/* 过滤器面板 */}
      {showFilters && (
        <FilterPanel 
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-gray-500">筛选结果</div>
          <div className="font-semibold">{stats.count} 条</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-gray-500">收入</div>
          <div className="font-semibold text-green-600">¥{stats.income.toFixed(2)}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-gray-500">支出</div>
          <div className="font-semibold text-red-600">¥{stats.expense.toFixed(2)}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-gray-500">净额</div>
          <div className={`font-semibold ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ¥{stats.balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 交易记录列表 */}
      <div className="space-y-4">
        {groupedTransactions.length > 0 ? (
          <>
            {groupedTransactions.map(([date, dayTransactions]) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    {format(new Date(date), 'MM月dd日 EEEE', { locale: zhCN })}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {dayTransactions.length} 笔交易
                  </div>
                </div>
                <div className="space-y-2">
                  {dayTransactions.map(transaction => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isDeleting={deletingId === transaction.id}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* 加载更多按钮 */}
            {filteredTransactions.length > displayCount && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="w-full max-w-xs"
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  加载更多 ({filteredTransactions.length - displayCount} 条)
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无交易记录</p>
              <p className="text-sm mt-2">点击&ldquo;记一笔&rdquo;开始记账</p>
            </div>
          </Card>
        )}
      </div>

      {/* 编辑弹窗 */}
      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}