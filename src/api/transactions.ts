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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: newTx, error: txError } = await supabase
    .from('transactions')
    .insert([{ ...transaction, user_id: user.id }])
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

export async function updateTransaction(transaction: Partial<Transaction> & { id: string }) {
  // To keep it simple, we could reverse the old transaction and apply the new one.
  // First, fetch the old transaction
  const { data: oldTx, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transaction.id)
    .single()
    
  if (fetchError) throw fetchError

  // Revert old transaction balances
  if (oldTx.type === 'expense') {
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', oldTx.account_id).single()
    if (acc) await supabase.from('accounts').update({ balance: Number(acc.balance) + Number(oldTx.amount) }).eq('id', oldTx.account_id)
  } else if (oldTx.type === 'income') {
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', oldTx.account_id).single()
    if (acc) await supabase.from('accounts').update({ balance: Number(acc.balance) - Number(oldTx.amount) }).eq('id', oldTx.account_id)
  } else if (oldTx.type === 'transfer' && oldTx.transfer_to_account_id) {
    const { data: accFrom } = await supabase.from('accounts').select('balance').eq('id', oldTx.account_id).single()
    if (accFrom) await supabase.from('accounts').update({ balance: Number(accFrom.balance) + Number(oldTx.amount) }).eq('id', oldTx.account_id)
    const { data: accTo } = await supabase.from('accounts').select('balance').eq('id', oldTx.transfer_to_account_id).single()
    if (accTo) await supabase.from('accounts').update({ balance: Number(accTo.balance) - Number(oldTx.amount) }).eq('id', oldTx.transfer_to_account_id)
  }

  const { data: newTx, error: txError } = await supabase
    .from('transactions')
    .update(transaction)
    .eq('id', transaction.id)
    .select()
    .single()
    
  if (txError) throw txError
  
  // Apply new transaction balances
  if (newTx.type === 'expense') {
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', newTx.account_id).single()
    if (acc) await supabase.from('accounts').update({ balance: Number(acc.balance) - Number(newTx.amount) }).eq('id', newTx.account_id)
  } else if (newTx.type === 'income') {
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', newTx.account_id).single()
    if (acc) await supabase.from('accounts').update({ balance: Number(acc.balance) + Number(newTx.amount) }).eq('id', newTx.account_id)
  } else if (newTx.type === 'transfer' && newTx.transfer_to_account_id) {
    const { data: accFrom } = await supabase.from('accounts').select('balance').eq('id', newTx.account_id).single()
    if (accFrom) await supabase.from('accounts').update({ balance: Number(accFrom.balance) - Number(newTx.amount) }).eq('id', newTx.account_id)
    const { data: accTo } = await supabase.from('accounts').select('balance').eq('id', newTx.transfer_to_account_id).single()
    if (accTo) await supabase.from('accounts').update({ balance: Number(accTo.balance) + Number(newTx.amount) }).eq('id', newTx.transfer_to_account_id)
  }

  return newTx as Transaction
}
