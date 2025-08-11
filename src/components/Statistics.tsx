'use client'

import { useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Transaction } from '@/types'

interface StatisticsProps {
  transactions: Transaction[]
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']

export default function Statistics({ transactions }: StatisticsProps) {
  // 计算统计数据
  const stats = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return format(date, 'yyyy-MM')
    })

    // 月度趋势数据
    const monthlyTrend = last6Months.map(month => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(month))
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month: format(new Date(month), 'MM月', { locale: zhCN }),
        income,
        expense,
        balance: income - expense
      }
    })

    // 当月分类统计
    const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth))
    
    // 收入分类统计
    const incomeByCategory = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const categoryName = t.category?.name || '未分类'
        acc[categoryName] = (acc[categoryName] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const incomeStats = Object.entries(incomeByCategory).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / Object.values(incomeByCategory).reduce((sum, v) => sum + v, 0)) * 100).toFixed(1)
    }))

    // 支出分类统计
    const expenseByCategory = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const categoryName = t.category?.name || '未分类'
        acc[categoryName] = (acc[categoryName] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const expenseStats = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / Object.values(expenseByCategory).reduce((sum, v) => sum + v, 0)) * 100).toFixed(1)
    }))

    // 总体统计
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      monthlyTrend,
      incomeStats,
      expenseStats,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    }
  }, [transactions])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ¥{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-blue-600">金额: ¥{data.value.toFixed(2)}</p>
          <p className="text-gray-600">占比: {data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">本月收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{stats.totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">本月支出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ¥{stats.totalExpense.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">本月结余</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ¥{stats.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月度趋势图 */}
      <Card>
        <CardHeader>
          <CardTitle>收支趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" fill="#10b981" name="收入" />
                <Bar dataKey="expense" fill="#ef4444" name="支出" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 分类统计饼图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 收入分类 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">本月收入分类</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.incomeStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.incomeStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.incomeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                暂无收入数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 支出分类 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">本月支出分类</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.expenseStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.expenseStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.expenseStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                暂无支出数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 结余趋势线图 */}
      <Card>
        <CardHeader>
          <CardTitle>结余趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="结余"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}