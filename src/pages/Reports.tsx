import { useQuery } from '@tanstack/react-query'
import { getTransactions } from '@/api/transactions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, TableProperties } from 'lucide-react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'

export default function Reports() {
  const { data: transactions, isLoading } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions })

  const downloadCSV = () => {
    if (!transactions) return
    const data = transactions.map(tx => ({
      Date: format(new Date(tx.date), 'yyyy-MM-dd'),
      Type: tx.type,
      Amount: tx.amount,
      Category: tx.categories?.name || '',
      Account: tx.accounts?.name || '',
      Notes: tx.notes || ''
    }))
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `nexspend-report-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadPDF = () => {
    if (!transactions) return
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('NexSpend Financial Report', 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 30)

    const tableData = transactions.map(tx => [
      format(new Date(tx.date), 'yyyy-MM-dd'),
      tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      `$${Number(tx.amount).toFixed(2)}`,
      tx.categories?.name || '-',
      tx.accounts?.name || '-',
      tx.notes || '-'
    ])

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Type', 'Amount', 'Category', 'Account', 'Notes']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    })

    doc.save(`nexspend-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Export your financial data in various formats.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <TableProperties className="h-6 w-6" />
            </div>
            <CardTitle>CSV Export</CardTitle>
            <CardDescription>
              Download all your transactions as a spreadsheet for Excel or Google Sheets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadCSV} disabled={isLoading || !transactions?.length} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <CardTitle>PDF Export</CardTitle>
            <CardDescription>
              Generate a formatted PDF report of your transactions suitable for printing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadPDF} disabled={isLoading || !transactions?.length} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
