import { useQuery } from '@tanstack/react-query'
import { getTransactions } from '@/api/transactions'
import { getAccounts } from '@/api/accounts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9']

export default function Analytics() {
  const { data: transactions } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions })
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts })

  // Process data for Money Distribution (Accounts Balance)
  const moneyDistributionData = accounts?.map(acc => ({
    name: acc.name,
    value: Number(acc.balance),
    color: acc.color || COLORS[0]
  })).filter(a => a.value > 0) || []

  // Process data for Expense by Money Account
  const expenses = transactions?.filter(tx => tx.type === 'expense') || []
  
  const expenseByAccount = expenses.reduce((acc, tx) => {
    const name = tx.accounts?.name || 'Unknown'
    acc[name] = (acc[name] || 0) + Number(tx.amount)
    return acc
  }, {} as Record<string, number>)
  
  const expenseByAccountData = Object.entries(expenseByAccount).map(([name, value]) => ({ name, value }))

  // Process data for Monthly Spending per Account
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), i)
    return { month: format(d, 'MMM yy'), timestamp: startOfMonth(d).getTime() } as Record<string, any>
  }).reverse()

  const accountNames = Array.from(new Set(expenses.map(tx => tx.accounts?.name || 'Unknown')))
  
  // Initialize month data with 0 for each account
  last6Months.forEach(monthData => {
    accountNames.forEach(name => {
      monthData[name] = 0
    })
  })

  expenses.forEach(tx => {
    const txDate = new Date(tx.date)
    const txMonth = format(txDate, 'MMM yy')
    const monthData = last6Months.find(m => m.month === txMonth)
    const accName = tx.accounts?.name || 'Unknown'
    if (monthData) {
      monthData[accName] = (monthData[accName] as number) + Number(tx.amount)
    }
  })

  // KPI Calculations
  const txCountsByAccount = expenses.reduce((acc, tx) => {
    const id = tx.account_id
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostUsedAccountId = Object.entries(txCountsByAccount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostUsedAccount = accounts?.find(a => a.id === mostUsedAccountId)

  const highestSpendingAccountId = Object.entries(expenseByAccount).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Deep dive into your money accounts and spending.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white dark:bg-zinc-900 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Most Used Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostUsedAccount?.name || 'N/A'}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {mostUsedAccountId ? `${txCountsByAccount[mostUsedAccountId]} transactions` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Highest Spending Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestSpendingAccountId || 'N/A'}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {highestSpendingAccountId ? `$${expenseByAccount[highestSpendingAccountId]?.toLocaleString('en-US', { minimumFractionDigits: 2 })} spent` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Money Distribution</CardTitle>
            <CardDescription>Current balance across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moneyDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {moneyDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {moneyDistributionData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Expense by Money Account</CardTitle>
            <CardDescription>Total spent from each wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseByAccountData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `$${value}`} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Monthly Spending per Account</CardTitle>
            <CardDescription>Track which accounts you use the most over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last6Months}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `$${value}`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  {accountNames.map((name, index) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
