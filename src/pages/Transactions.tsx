import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransactions, createTransaction, deleteTransaction } from '@/api/transactions'
import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Search } from 'lucide-react'

export default function Transactions() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const [newTx, setNewTx] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    category_id: '',
    notes: '',
    transfer_to_account_id: '',
  })

  const { data: transactions, isLoading: txLoading } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions })
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsOpen(false)
      setNewTx(prev => ({ ...prev, amount: '', notes: '' }))
      toast({ title: 'Success', description: 'Transaction added successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast({ title: 'Success', description: 'Transaction deleted successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTx.account_id) {
      return toast({ title: 'Error', description: 'Please select an account', variant: 'destructive' })
    }
    if (newTx.type === 'transfer' && !newTx.transfer_to_account_id) {
      return toast({ title: 'Error', description: 'Please select a destination account', variant: 'destructive' })
    }
    
    createMutation.mutate({
      type: newTx.type,
      amount: Number(newTx.amount),
      date: new Date(newTx.date).toISOString(),
      account_id: newTx.account_id,
      category_id: newTx.type !== 'transfer' ? (newTx.category_id || null) : null,
      notes: newTx.notes,
      transfer_to_account_id: newTx.type === 'transfer' ? newTx.transfer_to_account_id : null,
      receipt_url: null,
    })
  }

  const filteredTransactions = transactions?.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (search) {
      const s = search.toLowerCase()
      const matchName = tx.notes?.toLowerCase().includes(s)
      const matchCat = tx.categories?.name.toLowerCase().includes(s)
      const matchAcc = tx.accounts?.name.toLowerCase().includes(s)
      if (!matchName && !matchCat && !matchAcc) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Manage your income, expenses, and transfers.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-2">
                <Button type="button" variant={newTx.type === 'expense' ? 'default' : 'outline'} onClick={() => setNewTx({...newTx, type: 'expense'})} className={newTx.type === 'expense' ? 'bg-red-500 hover:bg-red-600' : ''}>
                  Expense
                </Button>
                <Button type="button" variant={newTx.type === 'income' ? 'default' : 'outline'} onClick={() => setNewTx({...newTx, type: 'income'})} className={newTx.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                  Income
                </Button>
                <Button type="button" variant={newTx.type === 'transfer' ? 'default' : 'outline'} onClick={() => setNewTx({...newTx, type: 'transfer'})} className={newTx.type === 'transfer' ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                  Transfer
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" required value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" required value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>{newTx.type === 'transfer' ? 'From Account' : 'Account'}</Label>
                <Select value={newTx.account_id} onValueChange={v => setNewTx({...newTx, account_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {newTx.type === 'transfer' && (
                <div className="space-y-2">
                  <Label>To Account</Label>
                  <Select value={newTx.transfer_to_account_id} onValueChange={v => setNewTx({...newTx, transfer_to_account_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newTx.type !== 'transfer' && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newTx.category_id} onValueChange={v => setNewTx({...newTx, category_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories?.filter(c => c.type === newTx.type).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={newTx.notes} onChange={e => setNewTx({...newTx, notes: e.target.value})} placeholder="Optional notes" />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-8" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : filteredTransactions?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No transactions found.</div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions?.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      tx.type === 'expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {tx.type === 'income' && <ArrowUpRight className="h-5 w-5" />}
                      {tx.type === 'expense' && <ArrowDownRight className="h-5 w-5" />}
                      {tx.type === 'transfer' && <ArrowRightLeft className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {tx.type === 'transfer' ? `Transfer to ${tx.transfer_to_account?.name}` : tx.notes || tx.categories?.name || 'Uncategorized'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()} • {tx.accounts?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${
                      tx.type === 'income' ? 'text-emerald-500' :
                      tx.type === 'expense' ? 'text-red-500' :
                      'text-blue-500'
                    }`}>
                      {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                      ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => {
                      if(confirm('Delete transaction?')) deleteMutation.mutate(tx)
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
