'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'
import { Transaction } from '@/types'

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: '请输入有效金额',
  }),
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, '请选择分类'),
  description: z.string().optional(),
  date: z.string().min(1, '请选择日期'),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  transaction?: Transaction
  onClose: () => void
  onSuccess: () => void
}

export default function TransactionForm({ transaction, onClose, onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense')
  const { categories } = useStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: transaction?.amount?.toString() || '',
      type: transaction?.type || 'expense',
      category_id: transaction?.category_id || '',
      description: transaction?.description || '',
      date: transaction?.date || format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const watchType = watch('type')
  const filteredCategories = categories.filter(c => c.type === watchType)

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true)
    try {
      const transactionData = {
        ...data,
        amount: parseFloat(data.amount),
        user_id: 'demo-user', // 临时使用，实际应从认证获取
      }

      if (transaction) {
        // 更新
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id)
        
        if (error) throw error
      } else {
        // 创建
        const { error } = await supabase
          .from('transactions')
          .insert([transactionData])
        
        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存交易失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{transaction ? '编辑' : '添加'}交易</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 类型选择 */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={watchType === 'expense' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'expense')}
                className="w-full"
              >
                支出
              </Button>
              <Button
                type="button"
                variant={watchType === 'income' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'income')}
                className="w-full"
              >
                收入
              </Button>
            </div>

            {/* 金额 */}
            <div>
              <label className="block text-sm font-medium mb-1">金额</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium mb-1">分类</label>
              <select
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('category_id')}
              >
                <option value="">请选择分类</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
              )}
            </div>

            {/* 日期 */}
            <div>
              <label className="block text-sm font-medium mb-1">日期</label>
              <Input
                type="date"
                {...register('date')}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium mb-1">备注（可选）</label>
              <Input
                placeholder="添加备注..."
                {...register('description')}
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}