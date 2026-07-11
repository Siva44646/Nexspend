import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAccounts } from '@/api/accounts'
import { getTransactions } from '@/api/transactions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TransactionList } from '@/components/transactions/TransactionList'
import { ChevronLeft, Wallet, Landmark, CreditCard, Building, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Landmark },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'savings', label: 'Savings', icon: Building },
  { value: 'wallet', label: 'Digital Wallet', icon: Wallet },
]

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9']

export default function AccountDetails() {
  const { id } = useParams()
  
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
  const { data: allTransactions } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions })

  const account = accounts?.find(a => a.id === id)
  
  // Filter transactions for this specific account
  const transactions = allTransactions?.filter(tx => tx.account_id === id || tx.transfer_to_account_id === id) || []

  if (!account) {
    return <div className="text-center py-10">Account not found or loading...</div>
  }

  const TypeIcon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet
  
  // Calculate specific metrics
  let totalIncome = 0
  let totalExpenses = 0
  
  transactions.forEach(tx => {
    if (tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_to_account_id === id)) {
      totalIncome += Number(tx.amount)
    }
    if (tx.type === 'expense' || (tx.type === 'transfer' && tx.account_id === id)) {
      totalExpenses += Number(tx.amount)
    }
  })

  // Income vs Expense Chart
  const incomeVsExpenseData = [
    { name: 'Income', value: totalIncome, color: '#10b981' },
    { name: 'Expense', value: totalExpenses, color: '#ef4444' }
  ].filter(d => d.value > 0)

  // Category Spending Chart (Expenses only)
  const categorySpending = transactions
    .filter(tx => (tx.type === 'expense' || (tx.type === 'transfer' && tx.account_id === id)))
    .reduce((acc, tx) => {
      const name = tx.type === 'transfer' ? 'Transfer Out' : (tx.categories?.name || 'Uncategorized')
      acc[name] = (acc[name] || 0) + Number(tx.amount)
      return acc
    }, {} as Record<string, number>)

  const categorySpendingData = Object.entries(categorySpending)
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
    .sort((a, b) => b.value - a.value)

  // Monthly Spending (Last 6 Months)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), i)
    return { month: format(d, 'MMM yy'), timestamp: startOfMonth(d).getTime(), spending: 0 }
  }).reverse()

  transactions
    .filter(tx => (tx.type === 'expense' || (tx.type === 'transfer' && tx.account_id === id)))
    .forEach(tx => {
      const txMonth = format(new Date(tx.date), 'MMM yy')
      const monthData = last6Months.find(m => m.month === txMonth)
      if (monthData) {
        monthData.spending += Number(tx.amount)
      }
    })

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      {/* Header Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="col-span-full md:col-span-1 bg-gradient-to-br shadow-lg border-none" style={{ backgroundImage: `linear-gradient(to bottom right, ${account.color}dd, ${account.color})`, color: 'white' }}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-bold opacity-90">{account.name}</CardTitle>
              <TypeIcon className="h-5 w-5 opacity-75" />
            </div>
            <CardDescription className="text-white/70 capitalize">{account.type.replace('_', ' ')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mt-2">
              ${Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-75 mt-2">Created {new Date(account.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total In</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-zinc-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Out</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-zinc-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-sm text-zinc-500 mt-1">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">In vs Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {incomeVsExpenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeVsExpenseData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                      {incomeVsExpenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"/> In</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"/> Out</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last6Months}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Line type="monotone" dataKey="spending" stroke={account.color || '#8b5cf6'} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {categorySpendingData.length > 0 && (
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySpendingData} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} hide />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categorySpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List specifically for this account */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Account Activity</CardTitle>
          <CardDescription>All transactions involving {account.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionList accountId={account.id} />
        </CardContent>
      </Card>
    </div>
  )
}
