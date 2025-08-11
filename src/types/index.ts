// 交易类型
export type TransactionType = 'income' | 'expense'

// 分类
export interface Category {
  id: string
  name: string
  type: TransactionType
  icon?: string
  color?: string
  user_id: string
  created_at: string
  updated_at: string
}

// 交易记录
export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category_id: string
  category?: Category
  description?: string
  date: string
  user_id: string
  created_at: string
  updated_at: string
}

// 预算
export interface Budget {
  id: string
  category_id?: string
  category?: Category
  amount: number
  month: string // 格式: YYYY-MM
  user_id: string
  created_at: string
  updated_at: string
}

// 用户
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// 统计数据
export interface Statistics {
  totalIncome: number
  totalExpense: number
  balance: number
  monthlyIncome: number
  monthlyExpense: number
  monthlyBalance: number
  categoryStats: CategoryStat[]
  monthlyTrend: MonthlyTrend[]
}

export interface CategoryStat {
  category: string
  amount: number
  percentage: number
  type: TransactionType
}

export interface MonthlyTrend {
  month: string
  income: number
  expense: number
  balance: number
}