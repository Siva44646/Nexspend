import { supabase } from '@/lib/supabase'

export type Account = {
  id: string
  user_id: string
  name: string
  type: string
  balance: number
  color: string
  icon: string
  description: string | null
  created_at: string
}

export async function getAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Account[]
}

export async function createAccount(account: Omit<Account, 'id' | 'user_id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('accounts')
    .insert([{ ...account, user_id: user.id }])
    .select()
    .single()
    
  if (error) throw error
  return data as Account
}

export async function updateAccount({ id, ...updates }: Partial<Account> & { id: string }) {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
    
  if (error) throw error
  return data as Account
}

export async function deleteAccount(id: string) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    
  if (error) throw error
}
