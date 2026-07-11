import { supabase } from '@/lib/supabase'

export type Category = {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense' | 'transfer'
  color: string
  icon: string
  created_at: string
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data as Category[]
}

export async function createCategory(category: Omit<Category, 'id' | 'user_id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single()
    
  if (error) throw error
  return data as Category
}
