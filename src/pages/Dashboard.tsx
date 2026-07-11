import { useQuery } from '@tanstack/react-query'
import { getAccounts } from '@/api/accounts'
import { getTransactions } from '@/api/transactions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, ArrowUpRight, Wallet, Landmark, CreditCard, Building } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Link } from 'react-router-dom'
import { TransactionList } from '@/components/transactions/TransactionList'

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Landmark },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'savings', label: 'Savings', icon: Building },
  { value: 'wallet', label: 'Digital Wallet', icon: Wallet },
]

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
  const { data: transactions, isLoading: txLoading } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions })

  const totalMoney = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const currentMonthTransactions = transactions?.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }) || []

  const totalExpenses = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
    
  if (accountsLoading || txLoading) {
    return <div className="text-center py-10">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Money</CardTitle>
            <DollarSign className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totalMoney.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-75 mt-1">Sum of all accounts</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-zinc-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Remaining Money</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ${totalMoney.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-zinc-500 mt-1">Available to spend</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Expenses</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              -${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-zinc-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Money Accounts</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
            <p className="text-sm text-zinc-500 mt-1">Active wallets</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4 border-none shadow-md bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Money Accounts</CardTitle>
            <CardDescription>Your current balances across all wallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {accounts?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No accounts created yet.</div>
              ) : (
                accounts?.map(acc => {
                  const TypeIcon = ACCOUNT_TYPES.find(t => t.value === acc.type)?.icon || Wallet
                  const balance = Number(acc.balance)
                  const percentage = totalMoney > 0 ? (balance / totalMoney) * 100 : 0
                  
                  return (
                    <Link to={`/accounts/${acc.id}`} key={acc.id} className="block group">
                      <div className="space-y-2 p-3 -mx-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full transition-transform group-hover:scale-110" style={{ backgroundColor: `${acc.color}20`, color: acc.color }}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm leading-none group-hover:text-primary transition-colors">{acc.name}</p>
                              <p className="text-xs text-muted-foreground mt-1 capitalize">{acc.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" indicatorColor={acc.color} />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 lg:col-span-3">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your full transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
