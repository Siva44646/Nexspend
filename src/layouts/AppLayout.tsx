import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  WalletCards, 
  ArrowLeftRight, 
  PieChart, 
  Target,
  FileText,
  LogOut,
  User,
  Settings,
  Menu
} from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export default function AppLayout() {
  const { session, isLoading, signOut, user } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: WalletCards },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Budgets', href: '/budgets', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Reports', href: '/reports', icon: FileText },
  ]

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            NexSpend
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.name} to={item.href}>
                <Button variant="ghost" className="w-full justify-start">
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Link to="/profile">
            <Button variant="ghost" className="w-full justify-start mb-2">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="p-6">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    NexSpend
                  </h1>
                </div>
                <nav className="flex-1 px-4 space-y-2 overflow-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-lg py-6">
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Button>
                      </Link>
                    )
                  })}
                </nav>
                <div className="p-4 border-t">
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start mb-2 py-6">
                      <Settings className="mr-3 h-5 w-5" />
                      Settings
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 py-6" onClick={() => { setIsMobileMenuOpen(false); signOut(); }}>
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold">NexSpend</h1>
          </div>
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
