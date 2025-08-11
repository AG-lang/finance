'use client'

import { useMemo, useState } from 'react'
import { format, subMonths, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Target } from 'lucide-react'
import { Transaction } from '@/types'
import { useStore } from '@/stores/useStore'

interface StatisticsProps {
  transactions: Transaction[]
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']

export default function Statistics({ transactions }: StatisticsProps) {
  const { budgets } = useStore()
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  // 计算统计数据
  const stats = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const currentYear = selectedYear
    
    // 根据视图模式选择时间范围
    const timeRange = viewMode === 'month' 
      ? Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i)
          return format(date, 'yyyy-MM')
        })
      : eachMonthOfInterval({
          start: startOfYear(new Date(currentYear, 0)),
          end: endOfYear(new Date(currentYear, 0))
        }).map(date => format(date, 'yyyy-MM'))

    // 月度/年度趋势数据
    const monthlyTrend = timeRange.map(month => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(month))
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month: format(new Date(month), viewMode === 'month' ? 'MM月' : 'M月', { locale: zhCN }),
        fullMonth: month,
        income,
        expense,
        balance: income - expense,
        净收益: income - expense
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

    // 计算预算执行情况
    const budgetExecution = budgets.map(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.category_id === budget.category_id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      return {
        category: budget.category?.name || '未分类',
        预算: budget.amount,
        实际: spent,
        执行率: budget.amount > 0 ? (spent / budget.amount * 100) : 0
      }
    })

    // 计算日均统计
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const currentDay = new Date().getDate()
    const avgDailyExpense = totalExpense / currentDay
    const projectedMonthlyExpense = avgDailyExpense * daysInMonth

    // 分类对比雷达图数据
    const radarData = expenseStats.slice(0, 6).map(stat => ({
      category: stat.name,
      当月: stat.value,
      // 获取上月同分类数据
      上月: transactions
        .filter(t => 
          t.date.startsWith(format(subMonths(new Date(), 1), 'yyyy-MM')) &&
          t.type === 'expense' &&
          t.category?.name === stat.name
        )
        .reduce((sum, t) => sum + t.amount, 0)
    }))

    return {
      monthlyTrend,
      incomeStats,
      expenseStats,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      budgetExecution,
      avgDailyExpense,
      projectedMonthlyExpense,
      radarData
    }
  }, [transactions, budgets, viewMode, selectedYear])

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
      {/* 视图切换 */}
      <div className="flex justify-between items-center">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'month' | 'year')}>
          <TabsList>
            <TabsTrigger value="month">月度视图</TabsTrigger>
            <TabsTrigger value="year">年度视图</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {viewMode === 'year' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              {selectedYear - 1}年
            </Button>
            <Button variant="default" size="sm">
              {selectedYear}年
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
            >
              {selectedYear + 1}年
            </Button>
          </div>
        )}
      </div>
      {/* 增强概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">日均支出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ¥{stats.avgDailyExpense.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              预计月支出: ¥{stats.projectedMonthlyExpense.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 增强的趋势图 */}
      <Card>
        <CardHeader>
          <CardTitle>收支趋势分析</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bar">
            <TabsList className="mb-4">
              <TabsTrigger value="bar">柱状图</TabsTrigger>
              <TabsTrigger value="line">折线图</TabsTrigger>
              <TabsTrigger value="area">面积图</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bar">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="收入" />
                    <Bar dataKey="expense" fill="#ef4444" name="支出" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="line">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="收入" />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="支出" />
                    <Line type="monotone" dataKey="净收益" stroke="#3b82f6" strokeWidth={2} name="净收益" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="area">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="收入" />
                    <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="支出" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
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

      {/* 预算执行情况 */}
      {stats.budgetExecution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              预算执行情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.budgetExecution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="预算" fill="#94a3b8" />
                  <Bar dataKey="实际" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats.budgetExecution.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      item.执行率 > 100 ? 'text-red-600' : 
                      item.执行率 > 80 ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {item.执行率.toFixed(1)}%
                    </span>
                    {item.执行率 > 100 && (
                      <span className="text-xs text-red-600">超支</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分类对比雷达图 */}
      {stats.radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>支出分类月度对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={stats.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis />
                  <Radar name="当月" dataKey="当月" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Radar name="上月" dataKey="上月" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}