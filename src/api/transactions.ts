import { supabase } from '@/lib/supabase'
import type { Account } from './accounts'
import type { Category } from './categories'

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: 'income' | 'expense' | 'transfer'
  amount: number
  date: string
  notes: string | null
  receipt_url: string | null
  transfer_to_account_id: string | null
  created_at: string
  
  // Joined fields
  accounts?: Account
  categories?: Category
  transfer_to_account?: Account
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      accounts:account_id (*),
      categories:category_id (*),
      transfer_to_account:transfer_to_account_id (*)
    `)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data as Transaction[]
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'accounts' | 'categories' | 'transfer_to_account'>) {
  // We need to use RPC or let the client do 2 calls to update balance.
  // Actually, wait, updating the balance via a trigger is much better, but since I didn't write a trigger for that in the SQL schema (I only wrote tables and RLS),
  // we must update the account balance here in the API call for now.
  
  const { data: newTx, error: txError } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single()
    
  if (txError) throw txError
  
  // Update balances manually since we don't have a DB trigger
  if (transaction.type === 'expense') {
    // Decrease balance
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).single()
    if (acc) {
      await supabase.from('accounts').update({ balance: Number(acc.balance) - Number(transaction.amount) }).eq('id', transaction.account_id)
    }
  } else if (transaction.type === 'income') {
    // Increase balance
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).single()
    if (acc) {
      await supabase.from('accounts').update({ balance: Number(acc.balance) + Number(transaction.amount) }).eq('id', transaction.account_id)
    }
  } else if (transaction.type === 'transfer' && transaction.transfer_to_account_id) {
    // Decrease from account_id, increase to transfer_to_account_id
    const { data: accFrom } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).single()
    if (accFrom) {
      await supabase.from('accounts').update({ balance: Number(accFrom.balance) - Number(transaction.amount) }).eq('id', transaction.account_id)
    }
    const { data: accTo } = await supabase.from('accounts').select('balance').eq('id', transaction.transfer_to_account_id).single()
    if (accTo) {
      await supabase.from('accounts').update({ balance: Number(accTo.balance) + Number(transaction.amount) }).eq('id', transaction.transfer_to_account_id)
    }
  }

  return newTx as Transaction
}

export async function deleteTransaction(transaction: Transaction) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transaction.id)
    
  if (error) throw error

  // Reverse balance changes
  if (transaction.type === 'expense') {
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).single()
    if (acc) {
      await supabase.from('accounts').update({ balance: Number(acc.balance) + Number(transaction.amount) }).eq('id', transaction.account_id)
    }
  } else if (transaction.type === 'income') {
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).single()
    if (acc) {
      await supabase.from('accounts').update({ balance: Number(acc.balance) - Number(transaction.amount) }).eq('id', transaction.account_id)
    }
  } else if (transaction.type === 'transfer' && transaction.transfer_to_account_id) {
    const { data: accFrom } = await supabase.from('accounts').select('balance').eq('id', transaction.account_id).single()
    if (accFrom) {
      await supabase.from('accounts').update({ balance: Number(accFrom.balance) + Number(transaction.amount) }).eq('id', transaction.account_id)
    }
    const { data: accTo } = await supabase.from('accounts').select('balance').eq('id', transaction.transfer_to_account_id).single()
    if (accTo) {
      await supabase.from('accounts').update({ balance: Number(accTo.balance) - Number(transaction.amount) }).eq('id', transaction.transfer_to_account_id)
    }
  }
}
