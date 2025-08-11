'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, Target, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'
import { Budget } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export default function BudgetManager() {
  const { budgets, setBudgets, categories, transactions } = useStore()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: '',
    month: format(new Date(), 'yyyy-MM')
  })

  const currentMonth = format(new Date(), 'yyyy-MM')

  // 计算每个分类的支出统计
  const getCategorySpending = (categoryId: string, month: string) => {
    return transactions
      .filter(t => 
        t.category_id === categoryId && 
        t.type === 'expense' && 
        t.date.startsWith(month)
      )
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const handleAdd = async () => {
    if (!newBudget.category_id || !newBudget.amount) return
    if (!user) {
      alert('请先登录')
      return
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          category_id: newBudget.category_id,
          amount: parseFloat(newBudget.amount),
          month: newBudget.month,
          user_id: user.id,
        }])
        .select('*, category:categories(*)')
        .single()

      if (error) throw error
      
      setBudgets([...budgets, data])
      setNewBudget({ category_id: '', amount: '', month: currentMonth })
      setShowForm(false)
    } catch (error) {
      console.error('添加预算失败:', error)
      alert('添加失败，请重试')
    }
  }

  const handleUpdate = async (budget: Budget) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update({ amount: budget.amount })
        .eq('id', budget.id)

      if (error) throw error
      
      setBudgets(budgets.map(b => b.id === budget.id ? budget : b))
      setEditingBudget(null)
    } catch (error) {
      console.error('更新预算失败:', error)
      alert('更新失败，请重试')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个预算吗？')) return

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setBudgets(budgets.filter(b => b.id !== id))
    } catch (error) {
      console.error('删除预算失败:', error)
      alert('删除失败，请重试')
    }
  }

  // 获取可用的支出分类（未设置预算的）
  const expenseCategories = categories.filter(c => c.type === 'expense')
  const availableCategories = expenseCategories.filter(category =>
    !budgets.some(budget => 
      budget.category_id === category.id && 
      budget.month === newBudget.month
    )
  )

  return (
    <div className="space-y-6">
      {/* 当前月份预算概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {format(new Date(), 'yyyy年MM月')}预算管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">还没有设置预算</p>
              <p className="text-sm text-gray-400 mt-2">为各个支出分类设置预算额度</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spent = getCategorySpending(budget.category_id || '', currentMonth)
                const remaining = budget.amount - spent
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
                const isOverBudget = spent > budget.amount

                return (
                  <div key={budget.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{budget.category?.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>预算: ¥{budget.amount.toFixed(2)}</span>
                          <span>已支出: ¥{spent.toFixed(2)}</span>
                          <span className={`${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {remaining >= 0 ? '剩余' : '超支'}: ¥{Math.abs(remaining).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {isOverBudget && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingBudget(budget)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(budget.id)}
                          className="h-8 w-8 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加预算表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>添加预算</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">选择分类</label>
                  <select
                    className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newBudget.category_id}
                    onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
                  >
                    <option value="">请选择分类</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">预算金额</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">月份</label>
                  <Input
                    type="month"
                    value={newBudget.month}
                    onChange={(e) => setNewBudget({ ...newBudget, month: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    取消
                  </Button>
                  <Button onClick={handleAdd} className="flex-1">
                    添加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 编辑预算表单 */}
      {editingBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>编辑预算</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">分类</label>
                  <Input
                    value={editingBudget.category?.name || ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">预算金额</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingBudget.amount}
                    onChange={(e) => setEditingBudget({ 
                      ...editingBudget, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingBudget(null)} 
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button onClick={() => handleUpdate(editingBudget)} className="flex-1">
                    保存
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 添加按钮 */}
      {availableCategories.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setShowForm(true)}
            size="lg"
            className="rounded-full shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            添加预算
          </Button>
        </div>
      )}
    </div>
  )
}