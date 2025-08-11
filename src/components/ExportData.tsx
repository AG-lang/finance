'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Download, FileSpreadsheet, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/stores/useStore'
import { Transaction } from '@/types'

export default function ExportData() {
  const { transactions, categories } = useStore()
  const [exportConfig, setExportConfig] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'all', // all, income, expense
    categoryId: '',
    format: 'xlsx' // xlsx, csv
  })
  const [exporting, setExporting] = useState(false)

  // 过滤交易数据
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // 日期过滤
      const transactionDate = transaction.date
      if (transactionDate < exportConfig.startDate || transactionDate > exportConfig.endDate) {
        return false
      }

      // 类型过滤
      if (exportConfig.type !== 'all' && transaction.type !== exportConfig.type) {
        return false
      }

      // 分类过滤
      if (exportConfig.categoryId && transaction.category_id !== exportConfig.categoryId) {
        return false
      }

      return true
    })
  }

  // 导出为Excel
  const exportToExcel = (data: Transaction[], filename: string) => {
    const exportData = data.map(transaction => ({
      '日期': transaction.date,
      '类型': transaction.type === 'income' ? '收入' : '支出',
      '分类': transaction.category?.name || '未分类',
      '金额': transaction.amount,
      '备注': transaction.description || '',
      '创建时间': format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm:ss')
    }))

    // 添加统计汇总
    const totalIncome = data
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = data
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpense

    // 添加空行和汇总
    exportData.push(
      {
        '日期': '',
        '类型': '',
        '分类': '',
        '金额': '',
        '备注': '',
        '创建时间': ''
      },
      {
        '日期': '统计汇总',
        '类型': '',
        '分类': '',
        '金额': '',
        '备注': '',
        '创建时间': ''
      },
      {
        '日期': '总收入',
        '类型': '',
        '分类': '',
        '金额': totalIncome,
        '备注': '',
        '创建时间': ''
      },
      {
        '日期': '总支出',
        '类型': '',
        '分类': '',
        '金额': totalExpense,
        '备注': '',
        '创建时间': ''
      },
      {
        '日期': '结余',
        '类型': '',
        '分类': '',
        '金额': balance,
        '备注': '',
        '创建时间': ''
      }
    )

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录')

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 12 }, // 日期
      { wch: 8 },  // 类型
      { wch: 12 }, // 分类
      { wch: 12 }, // 金额
      { wch: 20 }, // 备注
      { wch: 20 }  // 创建时间
    ]

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, filename)
  }

  // 导出为CSV
  const exportToCSV = (data: Transaction[], filename: string) => {
    const csvHeader = '日期,类型,分类,金额,备注,创建时间\n'
    const csvContent = data.map(transaction =>
      [
        transaction.date,
        transaction.type === 'income' ? '收入' : '支出',
        transaction.category?.name || '未分类',
        transaction.amount,
        `"${transaction.description || ''}"`,
        format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm:ss')
      ].join(',')
    ).join('\n')

    // 添加统计汇总
    const totalIncome = data
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = data
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpense

    const summary = `\n\n统计汇总\n总收入,,,${totalIncome},,\n总支出,,,${totalExpense},,\n结余,,,${balance},,`

    const blob = new Blob([csvHeader + csvContent + summary], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, filename)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const filteredData = getFilteredTransactions()
      
      if (filteredData.length === 0) {
        alert('没有符合条件的数据可以导出')
        return
      }

      const dateRange = `${exportConfig.startDate}_${exportConfig.endDate}`
      const typeLabel = exportConfig.type === 'all' ? '全部' : 
                       exportConfig.type === 'income' ? '收入' : '支出'
      const filename = `记账数据_${typeLabel}_${dateRange}.${exportConfig.format}`

      if (exportConfig.format === 'xlsx') {
        exportToExcel(filteredData, filename)
      } else {
        exportToCSV(filteredData, filename)
      }
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  const filteredCount = getFilteredTransactions().length

  return (
    <div className="space-y-6">
      {/* 导出配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            数据导出
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 日期范围 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">开始日期</label>
              <Input
                type="date"
                value={exportConfig.startDate}
                onChange={(e) => setExportConfig({ ...exportConfig, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">结束日期</label>
              <Input
                type="date"
                value={exportConfig.endDate}
                onChange={(e) => setExportConfig({ ...exportConfig, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* 类型和分类过滤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">交易类型</label>
              <select
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={exportConfig.type}
                onChange={(e) => setExportConfig({ ...exportConfig, type: e.target.value })}
              >
                <option value="all">全部</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">分类过滤</label>
              <select
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={exportConfig.categoryId}
                onChange={(e) => setExportConfig({ ...exportConfig, categoryId: e.target.value })}
              >
                <option value="">全部分类</option>
                {categories
                  .filter(c => exportConfig.type === 'all' || c.type === exportConfig.type)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 导出格式 */}
          <div>
            <label className="block text-sm font-medium mb-1">导出格式</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={exportConfig.format === 'xlsx' ? 'default' : 'outline'}
                onClick={() => setExportConfig({ ...exportConfig, format: 'xlsx' })}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel (xlsx)
              </Button>
              <Button
                variant={exportConfig.format === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportConfig({ ...exportConfig, format: 'csv' })}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* 预览信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>符合条件的记录: {filteredCount} 条</span>
            </div>
            {filteredCount > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                日期范围: {format(new Date(exportConfig.startDate), 'yyyy年MM月dd日', { locale: zhCN })} 
                至 {format(new Date(exportConfig.endDate), 'yyyy年MM月dd日', { locale: zhCN })}
              </div>
            )}
          </div>

          {/* 导出按钮 */}
          <Button
            onClick={handleExport}
            disabled={exporting || filteredCount === 0}
            className="w-full"
            size="lg"
          >
            {exporting ? (
              '导出中...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                导出数据 ({exportConfig.format.toUpperCase()})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">导出说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Excel格式(.xlsx): 包含完整的格式和样式，支持复杂的数据处理</p>
          <p>• CSV格式(.csv): 纯文本格式，兼容性好，可用Excel、Numbers等软件打开</p>
          <p>• 导出的数据包含：日期、类型、分类、金额、备注、创建时间</p>
          <p>• 自动计算并包含统计汇总：总收入、总支出、结余</p>
        </CardContent>
      </Card>
    </div>
  )
}