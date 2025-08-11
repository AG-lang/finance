import { create } from 'zustand'
import { Transaction, Category, Budget, User } from '@/types'

interface AppState {
  // 用户状态
  user: User | null
  setUser: (user: User | null) => void
  
  // 交易记录
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  
  // 分类
  categories: Category[]
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  deleteCategory: (id: string) => void
  
  // 预算
  budgets: Budget[]
  setBudgets: (budgets: Budget[]) => void
  addBudget: (budget: Budget) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  
  // 加载状态
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  // 用户状态
  user: null,
  setUser: (user) => set({ user }),
  
  // 交易记录
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) => 
    set((state) => ({ transactions: [...state.transactions, transaction] })),
  updateTransaction: (id, transaction) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...transaction } : t
      ),
    })),
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
  
  // 分类
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, category) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...category } : c
      ),
    })),
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
  
  // 预算
  budgets: [],
  setBudgets: (budgets) => set({ budgets }),
  addBudget: (budget) =>
    set((state) => ({ budgets: [...state.budgets, budget] })),
  updateBudget: (id, budget) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...budget } : b
      ),
    })),
  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),
  
  // 加载状态
  loading: false,
  setLoading: (loading) => set({ loading }),
}))