import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransaction } from '@/api/transactions'
import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import { TransactionList } from '@/components/transactions/TransactionList'

export default function Transactions() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const [newTx, setNewTx] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    category_id: '',
    notes: '',
    transfer_to_account_id: '',
  })

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTx.account_id) {
      return toast({ title: 'Error', description: 'Please select an account', variant: 'destructive' })
    }
    if (newTx.type === 'transfer' && !newTx.transfer_to_account_id) {
      return toast({ title: 'Error', description: 'Please select a destination account', variant: 'destructive' })
    }

    const selectedAcc = accounts?.find(a => a.id === newTx.account_id)
    if (selectedAcc && (newTx.type === 'expense' || newTx.type === 'transfer')) {
      if (selectedAcc.type !== 'credit_card' && Number(newTx.amount) > Number(selectedAcc.balance)) {
        return toast({ title: 'Error', description: `Insufficient balance in ${selectedAcc.name}. Available: ${selectedAcc.balance}`, variant: 'destructive' })
      }
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
          <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
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
                <Label>Expense Name / Notes</Label>
                <Input value={newTx.notes} onChange={e => setNewTx({...newTx, notes: e.target.value})} placeholder="What was this for?" />
              </div>

              <Button type="submit" className="w-full py-6 text-base" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <TransactionList />
    </div>
  )
}
