import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import AccountDetails from './pages/AccountDetails'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      {/* App Routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetails />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
