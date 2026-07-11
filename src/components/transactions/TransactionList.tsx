import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTransactions, type Transaction } from '@/api/transactions'
import { getCategories } from '@/api/categories'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Search, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { TransactionModal } from './TransactionModal'

interface TransactionListProps {
  accountId?: string
}

export function TransactionList({ accountId }: TransactionListProps) {
  const { data: transactions, isLoading } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    
    let filtered = transactions

    // Filter by account if specified
    if (accountId) {
      filtered = filtered.filter(tx => tx.account_id === accountId || tx.transfer_to_account_id === accountId)
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType)
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category_id === filterCategory)
    }

    // Filter by date
    if (filterDate !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date)
        txDate.setHours(0, 0, 0, 0)
        
        switch (filterDate) {
          case 'today':
            return txDate.getTime() === today.getTime()
          case 'yesterday':
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            return txDate.getTime() === yesterday.getTime()
          case 'this_week':
            const startOfWeek = new Date(today)
            startOfWeek.setDate(today.getDate() - today.getDay())
            return txDate >= startOfWeek
          case 'this_month':
            return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear()
          default:
            return true
        }
      })
    }

    // Filter by search
    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(tx => {
        const matchName = tx.notes?.toLowerCase().includes(s)
        const matchCat = tx.categories?.name.toLowerCase().includes(s)
        const matchAcc = tx.accounts?.name.toLowerCase().includes(s)
        return matchName || matchCat || matchAcc
      })
    }

    return filtered
  }, [transactions, accountId, filterType, filterCategory, filterDate, search])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-8 bg-transparent border-zinc-200 dark:border-zinc-800" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="w-full sm:w-[150px] bg-transparent border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[150px] bg-transparent border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[150px] bg-transparent border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10">Loading transactions...</div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border shadow-sm">
            No transactions found.
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedTransactions.map(tx => {
              const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_to_account_id === accountId)
              const isExpense = tx.type === 'expense' || (tx.type === 'transfer' && tx.account_id === accountId)
              
              return (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2.5 rounded-xl ${
                      isIncome && tx.type !== 'transfer' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      isExpense && tx.type !== 'transfer' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    } group-hover:scale-110 transition-transform`}>
                      {tx.type === 'income' && <ArrowDownLeft className="h-5 w-5" />}
                      {tx.type === 'expense' && <ArrowUpRight className="h-5 w-5" />}
                      {tx.type === 'transfer' && <ArrowRightLeft className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">
                        {tx.type === 'transfer' 
                          ? tx.account_id === accountId 
                            ? `Transfer to ${tx.transfer_to_account?.name}`
                            : `Transfer from ${tx.accounts?.name}`
                          : tx.notes || tx.categories?.name || 'Uncategorized'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {new Date(tx.date).toLocaleDateString()} • {tx.type === 'transfer' ? 'Transfer' : tx.categories?.name || 'Other'} {!accountId && `• ${tx.accounts?.name}`}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${
                    isIncome && tx.type !== 'transfer' ? 'text-emerald-500' :
                    isExpense && tx.type !== 'transfer' ? 'text-red-500' :
                    isIncome ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {isExpense ? '-' : '+'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <TransactionModal 
        transaction={selectedTx} 
        isOpen={!!selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />
    </div>
  )
}
