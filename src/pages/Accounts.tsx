import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAccounts, createAccount, deleteAccount, updateAccount } from '@/api/accounts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wallet, Landmark, CreditCard, Building, Trash2, Edit } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Landmark },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'savings', label: 'Savings', icon: Building },
  { value: 'wallet', label: 'Digital Wallet', icon: Wallet },
]

export default function Accounts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank',
    balance: '',
    color: '#3b82f6',
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  })

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsOpen(false)
      setNewAccount({ name: '', type: 'bank', balance: '', color: '#3b82f6' })
      toast({ title: 'Success', description: 'Account created successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsOpen(false)
      setEditingId(null)
      setNewAccount({ name: '', type: 'bank', balance: '', color: '#3b82f6' })
      toast({ title: 'Success', description: 'Account updated successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast({ title: 'Success', description: 'Account deleted successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: newAccount.name,
        type: newAccount.type,
        balance: Number(newAccount.balance) || 0,
        color: newAccount.color,
        icon: newAccount.type,
      })
    } else {
      createMutation.mutate({
        name: newAccount.name,
        type: newAccount.type,
        balance: Number(newAccount.balance) || 0,
        color: newAccount.color,
        icon: newAccount.type,
        description: null,
      })
    }
  }

  const openEditDialog = (account: any) => {
    setEditingId(account.id)
    setNewAccount({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      color: account.color || '#3b82f6',
    })
    setIsOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setEditingId(null)
      setNewAccount({ name: '', type: 'bank', balance: '', color: '#3b82f6' })
    }
  }

  const getTotalBalance = () => {
    return accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">Manage your money sources here.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Account' : 'Add New Account'}</DialogTitle>
              <DialogDescription>{editingId ? 'Update your account details.' : 'Create a new account to track your money.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input 
                  id="name" 
                  value={newAccount.name} 
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="e.g. Chase Checking" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={newAccount.type} onValueChange={v => setNewAccount({...newAccount, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance</Label>
                <Input 
                  id="balance" 
                  type="number" 
                  step="0.01" 
                  value={newAccount.balance} 
                  onChange={e => setNewAccount({...newAccount, balance: e.target.value})}
                  placeholder="0.00" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Theme Color</Label>
                <div className="flex gap-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${newAccount.color === color ? 'scale-110 border-zinc-900 dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewAccount({...newAccount, color})}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full py-6 text-base" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update Account' : 'Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium opacity-90">Total Money</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ${getTotalBalance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-75 mt-2">Across all {accounts?.length || 0} accounts</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="col-span-3 text-center py-10">Loading accounts...</div>
        ) : accounts?.length === 0 ? (
          <div className="col-span-3 text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
            No accounts found. Create one to get started!
          </div>
        ) : (
          accounts?.map((account) => {
            const TypeIcon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet
            return (
              <Card key={account.id} className="min-w-0 relative overflow-hidden group hover:shadow-lg transition-all">
                <div 
                  className="absolute top-0 left-0 w-1 h-full" 
                  style={{ backgroundColor: account.color || '#3b82f6' }}
                />
                <CardHeader className="flex flex-row items-start justify-between pb-2 gap-2 min-w-0">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-xl font-bold truncate" title={account.name}>{account.name}</CardTitle>
                    <CardDescription className="capitalize flex items-center gap-1 truncate">
                      <TypeIcon className="w-3 h-3" />
                      {account.type.replace('_', ' ')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                      onClick={() => openEditDialog(account)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this account?')) {
                          deleteMutation.mutate(account.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
