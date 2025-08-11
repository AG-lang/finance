'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Edit2, Trash2, Search, Filter, X, Calendar, DollarSign, Tag, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Transaction } from '@/types'
import { createClient } from '@/utils/supabase/client'
import { useStore } from '@/stores/useStore'
import TransactionForm from './TransactionForm'

interface TransactionListProps {
  transactions: Transaction[]
  onRefresh: () => void
}

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
  const supabase = createClient()

  const handleDelete = async (id: string) => {
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
  }

  // 过滤交易记录
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // 搜索过滤
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchDescription = transaction.description?.toLowerCase().includes(searchLower)
        const matchCategory = transaction.category?.name.toLowerCase().includes(searchLower)
        const matchAmount = transaction.amount.toString().includes(searchTerm)
        if (!matchDescription && !matchCategory && !matchAmount) {
          return false
        }
      }

      // 日期范围过滤
      if (filters.dateRange !== 'all') {
        const transactionDate = new Date(transaction.date)
        if (filters.dateRange === 'thisMonth') {
          const now = new Date()
          const monthStart = startOfMonth(now)
          const monthEnd = endOfMonth(now)
          if (!isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })) {
            return false
          }
        } else if (filters.dateRange === 'lastMonth') {
          const now = new Date()
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
          const monthStart = startOfMonth(lastMonth)
          const monthEnd = endOfMonth(lastMonth)
          if (!isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })) {
            return false
          }
        } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
          const start = new Date(filters.startDate)
          const end = new Date(filters.endDate)
          if (!isWithinInterval(transactionDate, { start, end })) {
            return false
          }
        }
      }

      // 类型过滤
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false
      }

      // 分类过滤
      if (filters.categoryId !== 'all' && transaction.category_id !== filters.categoryId) {
        return false
      }

      // 金额范围过滤
      if (filters.minAmount && transaction.amount < parseFloat(filters.minAmount)) {
        return false
      }
      if (filters.maxAmount && transaction.amount > parseFloat(filters.maxAmount)) {
        return false
      }

      return true
    })
  }, [transactions, searchTerm, filters])

  // 重置过滤器
  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      startDate: '',
      endDate: '',
      type: 'all',
      categoryId: 'all',
      minAmount: '',
      maxAmount: ''
    })
    setSearchTerm('')
  }

  // 获取活动过滤器数量
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm) count++
    if (filters.dateRange !== 'all') count++
    if (filters.type !== 'all') count++
    if (filters.categoryId !== 'all') count++
    if (filters.minAmount) count++
    if (filters.maxAmount) count++
    return count
  }, [searchTerm, filters])

  // 按日期分组
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {} as Record<string, Transaction[]>)

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      {/* 搜索和筛选栏 */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索描述、分类或金额..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              筛选
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-gray-500"
              >
                <X className="h-4 w-4" />
                清除
              </Button>
            )}
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {/* 日期范围 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  日期范围
                </label>
                <select
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                >
                  <option value="all">全部</option>
                  <option value="thisMonth">本月</option>
                  <option value="lastMonth">上月</option>
                  <option value="custom">自定义</option>
                </select>
                {filters.dateRange === 'custom' && (
                  <div className="mt-2 space-y-2">
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      placeholder="开始日期"
                    />
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      placeholder="结束日期"
                    />
                  </div>
                )}
              </div>

              {/* 类型 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  类型
                </label>
                <select
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                >
                  <option value="all">全部</option>
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  分类
                </label>
                <select
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.categoryId}
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                >
                  <option value="all">全部分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.type === 'income' ? '收入' : '支出'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 金额范围 */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">金额范围</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="最小金额"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    className="flex-1"
                  />
                  <span className="text-gray-500">至</span>
                  <Input
                    type="number"
                    placeholder="最大金额"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 搜索结果统计 */}
      {(searchTerm || activeFilterCount > 0) && (
        <div className="text-sm text-gray-600">
          找到 {filteredTransactions.length} 条记录
          {filteredTransactions.length > 0 && (
            <span className="ml-2">
              (总计收入: ¥{filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
              , 总计支出: ¥{filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)})
            </span>
          )}
        </div>
      )}

      {/* 交易记录列表 */}
      {filteredTransactions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            {searchTerm || activeFilterCount > 0 ? '没有找到匹配的记录' : '暂无交易记录'}
          </p>
          {searchTerm || activeFilterCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4"
            >
              清除筛选
            </Button>
          ) : (
            <p className="text-sm text-gray-400 mt-2">点击&ldquo;记一笔&rdquo;开始记账</p>
          )}
        </Card>
      ) : (
        sortedDates.map((date) => {
        const dayTransactions = groupedTransactions[date]
        const dayIncome = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const dayExpense = dayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        return (
          <Card key={date} className="overflow-hidden">
            {/* 日期头部 */}
            <div className="bg-gray-50 px-4 py-2 border-b">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {format(new Date(date), 'MM月dd日 EEEE', { locale: zhCN })}
                </span>
                <div className="flex gap-4 text-sm">
                  {dayIncome > 0 && (
                    <span className="text-green-600">
                      收入: ¥{dayIncome.toFixed(2)}
                    </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-red-600">
                      支出: ¥{dayExpense.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 交易列表 */}
            <div className="divide-y">
              {dayTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {transaction.category?.name || '未分类'}
                        </span>
                        {transaction.description && (
                          <span className="text-sm text-gray-500">
                            {transaction.description}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        ¥{transaction.amount.toFixed(2)}
                      </span>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTransaction(transaction)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={deletingId === transaction.id}
                          className="h-8 w-8 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })
      )}
      
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