import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Clients from './pages/Clients'
import Products from './pages/Products'
import Invoices from './pages/Invoices'          // <-- added
import ComingSoon from './components/ComingSoon'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute adminOnly><ComingSoon title="Settings" icon="ti-settings" phase="Phase 6" /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
