'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Transaction } from '@/types'
import { supabase } from '@/lib/supabase'
import TransactionForm from './TransactionForm'

interface TransactionListProps {
  transactions: Transaction[]
  onRefresh: () => void
}

export default function TransactionList({ transactions, onRefresh }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  // 按日期分组
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {} as Record<string, Transaction[]>)

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a))

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">暂无交易记录</p>
        <p className="text-sm text-gray-400 mt-2">点击&ldquo;记一笔&rdquo;开始记账</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
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
      })}

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