import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { updateTransaction, deleteTransaction, type Transaction } from '@/api/transactions'
import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'

interface TransactionModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

export function TransactionModal({ transaction, isOpen, onClose }: TransactionModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const [editForm, setEditForm] = useState({
    amount: '',
    date: '',
    account_id: '',
    category_id: '',
    notes: '',
    transfer_to_account_id: '',
  })

  useEffect(() => {
    if (transaction) {
      setEditForm({
        amount: transaction.amount.toString(),
        date: transaction.date.split('T')[0],
        account_id: transaction.account_id,
        category_id: transaction.category_id || '',
        notes: transaction.notes || '',
        transfer_to_account_id: transaction.transfer_to_account_id || '',
      })
      setIsEditing(false)
    }
  }, [transaction, isOpen])

  const updateMutation = useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast({ title: 'Success', description: 'Transaction updated successfully' })
      onClose()
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
      onClose()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    updateMutation.mutate({
      id: transaction.id,
      amount: Number(editForm.amount),
      date: new Date(editForm.date).toISOString(),
      account_id: editForm.account_id,
      category_id: transaction.type !== 'transfer' ? (editForm.category_id || null) : null,
      notes: editForm.notes,
      transfer_to_account_id: transaction.type === 'transfer' ? editForm.transfer_to_account_id : null,
    })
  }

  if (!transaction) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this transaction.' : 'View details of this transaction.'}
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="font-medium capitalize">{transaction.type}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Amount</Label>
                <div className={`font-medium ${
                  transaction.type === 'income' ? 'text-emerald-500' :
                  transaction.type === 'expense' ? 'text-red-500' :
                  'text-blue-500'
                }`}>
                  {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
                  ${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <div className="font-medium">{new Date(transaction.date).toLocaleDateString()}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Account</Label>
                <div className="font-medium">{transaction.accounts?.name || 'Unknown'}</div>
              </div>
              {transaction.type === 'transfer' ? (
                <div>
                  <Label className="text-muted-foreground">Transfer To</Label>
                  <div className="font-medium">{transaction.transfer_to_account?.name || 'Unknown'}</div>
                </div>
              ) : (
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <div className="font-medium">{transaction.categories?.name || 'Uncategorized'}</div>
                </div>
              )}
              <div className="col-span-2 min-w-0">
                <Label className="text-muted-foreground">Notes</Label>
                <div className="font-medium break-words">{transaction.notes || 'No notes provided.'}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button className="flex-1 py-6 text-base" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              <Button className="flex-1 py-6 text-base" variant="destructive" onClick={() => {
                if (confirm('Are you sure you want to delete this transaction?')) {
                  deleteMutation.mutate(transaction)
                }
              }}>Delete</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" required value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" required value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{transaction.type === 'transfer' ? 'From Account' : 'Account'}</Label>
              <Select value={editForm.account_id} onValueChange={v => setEditForm({...editForm, account_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {transaction.type === 'transfer' && (
              <div className="space-y-2">
                <Label>To Account</Label>
                <Select value={editForm.transfer_to_account_id} onValueChange={v => setEditForm({...editForm, transfer_to_account_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {transaction.type !== 'transfer' && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editForm.category_id} onValueChange={v => setEditForm({...editForm, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.filter(c => c.type === transaction.type).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Optional notes" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 py-6 text-base" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 py-6 text-base" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
