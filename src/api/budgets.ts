import { supabase } from '@/lib/supabase'
import type { Category } from './categories'

export type Budget = {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  period: 'monthly' | 'weekly' | 'yearly'
  created_at: string
  categories?: Category
}

export async function getBudgets() {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories:category_id (*)
    `)
  
  if (error) throw error
  return data as Budget[]
}

export async function createBudget(budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'categories'>) {
  const { data, error } = await supabase
    .from('budgets')
    .insert([budget])
    .select()
    .single()
    
  if (error) throw error
  return data as Budget
}

export async function deleteBudget(id: string) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    
  if (error) throw error
}
