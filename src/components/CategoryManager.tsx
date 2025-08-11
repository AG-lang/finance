'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/stores/useStore'
import { createClient } from '@/utils/supabase/client'
import { Category, TransactionType } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export default function CategoryManager() {
  const { categories, setCategories } = useStore()
  const { user } = useAuth()
  const supabase = createClient()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' as TransactionType })
  const [showForm, setShowForm] = useState(false)

  const handleAdd = async () => {
    if (!newCategory.name.trim()) return
    if (!user) {
      alert('请先登录')
      return
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name,
          type: newCategory.type,
          user_id: user.id,
        }])
        .select()
        .single()

      if (error) throw error
      
      setCategories([...categories, data])
      setNewCategory({ name: '', type: 'expense' })
      setShowForm(false)
    } catch (error) {
      console.error('添加分类失败:', error)
      alert('添加失败，请重试')
    }
  }

  const handleUpdate = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: category.name })
        .eq('id', category.id)

      if (error) throw error
      
      setCategories(categories.map(c => c.id === category.id ? category : c))
      setEditingCategory(null)
    } catch (error) {
      console.error('更新分类失败:', error)
      alert('更新失败，请重试')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('删除分类后，相关的交易记录将失去分类，确定删除吗？')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setCategories(categories.filter(c => c.id !== id))
    } catch (error) {
      console.error('删除分类失败:', error)
      alert('删除失败，请重试')
    }
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 收入分类 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">收入分类</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incomeCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                {editingCategory?.id === category.id ? (
                  <Input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    onBlur={() => handleUpdate(editingCategory)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdate(editingCategory)
                      }
                    }}
                    className="flex-1 mr-2"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="flex-1">{category.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(category)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 支出分类 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">支出分类</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {expenseCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                {editingCategory?.id === category.id ? (
                  <Input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    onBlur={() => handleUpdate(editingCategory)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdate(editingCategory)
                      }
                    }}
                    className="flex-1 mr-2"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="flex-1">{category.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(category)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 添加分类表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>添加分类</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">分类名称</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="输入分类名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={newCategory.type === 'income' ? 'default' : 'outline'}
                      onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
                    >
                      收入
                    </Button>
                    <Button
                      variant={newCategory.type === 'expense' ? 'default' : 'outline'}
                      onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
                    >
                      支出
                    </Button>
                  </div>
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

      {/* 添加按钮 */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowForm(true)}
          size="lg"
          className="rounded-full shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          添加分类
        </Button>
      </div>
    </div>
  )
}