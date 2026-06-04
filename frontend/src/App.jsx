import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth.store'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/Login'
import OtpPage from './pages/OtpVerify'
import ForgotPasswordPage from './pages/ForgotPassword'
import ResetPasswordPage from './pages/ResetPassword'
import ChangePasswordPage from './pages/ChangePassword'
import DashboardPage from './pages/Dashboard'
import ExtinguishersPage from './pages/Extinguishers'
import ExtinguisherDetailPage from './pages/ExtinguisherDetail'
import InspectionsPage from './pages/Inspections'
import MaintenancePage from './pages/Maintenance'
import ReportsPage from './pages/Reports'
import UsersPage from './pages/Users'
import ProfilePage from './pages/Profile'
import NotFoundPage from './pages/NotFound'

const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="extinguishers" element={<ExtinguishersPage />} />
        <Route path="extinguishers/:id" element={<ExtinguisherDetailPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
