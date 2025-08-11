'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Bell, X, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/stores/useStore'

interface BudgetAlert {
  id: string
  type: 'warning' | 'danger' | 'info'
  title: string
  message: string
  category: string
  percentage: number
  amount: number
  remaining: number
}

export default function BudgetAlerts() {
  const { budgets, transactions } = useStore()
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [showAlerts, setShowAlerts] = useState(true)

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    // 计算每个预算的执行情况并生成提醒
    const newAlerts: BudgetAlert[] = []

    budgets.forEach((budget) => {
      if (budget.month !== currentMonth) return

      const spent = transactions
        .filter(t => 
          t.category_id === budget.category_id && 
          t.type === 'expense' && 
          t.date.startsWith(currentMonth)
        )
        .reduce((sum, t) => sum + t.amount, 0)

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      const remaining = budget.amount - spent

      // 生成不同级别的提醒
      if (percentage >= 100) {
        // 超支提醒
        newAlerts.push({
          id: `${budget.id}-overspent`,
          type: 'danger',
          title: '预算超支警告',
          message: `${budget.category?.name}分类已超支¥${Math.abs(remaining).toFixed(2)}`,
          category: budget.category?.name || '未分类',
          percentage,
          amount: spent,
          remaining
        })
      } else if (percentage >= 80) {
        // 预算临界提醒
        newAlerts.push({
          id: `${budget.id}-warning`,
          type: 'warning',
          title: '预算临界提醒',
          message: `${budget.category?.name}分类已使用${percentage.toFixed(1)}%，剩余¥${remaining.toFixed(2)}`,
          category: budget.category?.name || '未分类',
          percentage,
          amount: spent,
          remaining
        })
      } else if (percentage >= 50 && percentage < 80) {
        // 正常进度提醒（可选）
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
        const currentDay = new Date().getDate()
        const monthProgress = (currentDay / daysInMonth) * 100

        if (percentage > monthProgress + 20) {
          // 支出速度过快
          newAlerts.push({
            id: `${budget.id}-pace`,
            type: 'info',
            title: '支出速度提醒',
            message: `${budget.category?.name}分类支出速度较快，当前已使用${percentage.toFixed(1)}%`,
            category: budget.category?.name || '未分类',
            percentage,
            amount: spent,
            remaining
          })
        }
      }
    })

    // 过滤已关闭的提醒
    setAlerts(newAlerts.filter(alert => !dismissedAlerts.includes(alert.id)))
  }, [budgets, transactions, currentMonth, dismissedAlerts])

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId])
  }

  const getAlertIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <Bell className="h-5 w-5 text-orange-500" />
      case 'info':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertStyles = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'danger':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-orange-200 bg-orange-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
    }
  }

  if (alerts.length === 0 || !showAlerts) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          预算提醒
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAlerts(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertStyles(alert.type)} relative`}
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{alert.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                
                {/* 进度条 */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>已使用</span>
                    <span>{alert.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        alert.type === 'danger' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 建议 */}
                {alert.type === 'danger' && (
                  <p className="text-xs text-red-600 mt-2">
                    建议：立即停止该分类支出或调整预算
                  </p>
                )}
                {alert.type === 'warning' && (
                  <p className="text-xs text-orange-600 mt-2">
                    建议：控制该分类支出，避免超支
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
                className="absolute top-2 right-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* 总体建议 */}
        {alerts.some(a => a.type === 'danger') && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>💡 理财建议：</strong>
              您有{alerts.filter(a => a.type === 'danger').length}个分类已超支，
              建议立即审查支出并调整消费计划。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}