'use client'

import { useMemo, useState } from 'react'
import { format, subMonths, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts'
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
  
  // 使用 useMemo 缓存所有计算结果
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

    // 预算使用情况
    const budgetUsage = budgets.map(budget => {
      const categoryExpense = currentMonthTransactions
        .filter(t => t.type === 'expense' && t.category_id === budget.category_id)
        .reduce((sum, t) => sum + t.amount, 0)
      
      const percentage = (categoryExpense / budget.amount) * 100
      
      return {
        name: budget.category?.name || '未分类',
        预算: budget.amount,
        已用: categoryExpense,
        剩余: Math.max(0, budget.amount - categoryExpense),
        percentage: Math.min(100, percentage)
      }
    })

    // 年度对比数据
    const yearComparison = Array.from({ length: 12 }, (_, i) => i).map(month => {
      const currentYearMonth = `${currentYear}-${String(month + 1).padStart(2, '0')}`
      const lastYearMonth = `${currentYear - 1}-${String(month + 1).padStart(2, '0')}`
      
      const currentYearData = transactions.filter(t => t.date.startsWith(currentYearMonth))
      const lastYearData = transactions.filter(t => t.date.startsWith(lastYearMonth))
      
      return {
        month: `${month + 1}月`,
        今年: currentYearData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        去年: lastYearData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      }
    })

    return {
      monthlyTrend,
      incomeStats,
      expenseStats,
      totalIncome,
      totalExpense,
      budgetUsage,
      yearComparison,
      currentMonth
    }
  }, [transactions, budgets, viewMode, selectedYear])

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            月度视图
          </Button>
          <Button
            variant={viewMode === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('year')}
          >
            年度视图
          </Button>
        </div>
        {viewMode === 'year' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              {selectedYear - 1}年
            </Button>
            <Button
              variant="default"
              size="sm"
            >
              {selectedYear}年
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear + 1)}
            >
              {selectedYear + 1}年
            </Button>
          </div>
        )}
      </div>

      {/* 统计图表 */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trend">收支趋势</TabsTrigger>
          <TabsTrigger value="category">分类统计</TabsTrigger>
          <TabsTrigger value="budget">预算分析</TabsTrigger>
          <TabsTrigger value="comparison">年度对比</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{viewMode === 'month' ? '近6个月' : `${selectedYear}年`}收支趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="收入"
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    name="支出"
                    stackId="2"
                    stroke="#ef4444" 
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>净收益趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                  <Line 
                    type="monotone" 
                    dataKey="净收益" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>收入分类（本月）</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.incomeStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.incomeStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }: any) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.incomeStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    暂无收入数据
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>支出分类（本月）</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.expenseStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.expenseStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }: any) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.expenseStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    暂无支出数据
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>分类支出排行</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.expenseStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.expenseStats} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>预算使用情况</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.budgetUsage.length > 0 ? (
                <div className="space-y-4">
                  {stats.budgetUsage.map((budget, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{budget.name}</span>
                        <span className="text-gray-500">
                          ¥{budget.已用.toFixed(2)} / ¥{budget.预算.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            budget.percentage > 90 ? 'bg-red-600' : 
                            budget.percentage > 70 ? 'bg-yellow-600' : 
                            'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(100, budget.percentage)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>使用 {budget.percentage.toFixed(1)}%</span>
                        <span>剩余 ¥{budget.剩余.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                  <Target className="h-12 w-12 mb-4 text-gray-300" />
                  <p>暂未设置预算</p>
                  <p className="text-sm mt-2">请前往预算管理页面设置预算</p>
                </div>
              )}
            </CardContent>
          </Card>

          {stats.budgetUsage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>预算对比图</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={stats.budgetUsage}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="使用率" dataKey="percentage" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>年度支出对比</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.yearComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="去年" fill="#94a3b8" />
                  <Bar dataKey="今年" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}