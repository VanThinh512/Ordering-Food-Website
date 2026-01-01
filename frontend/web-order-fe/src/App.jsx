import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { useCartStore } from './stores/cartStore'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GoogleCallbackPage from './pages/GoogleCallbackPage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import TablesPage from './pages/TablesPage'
import TableManagementPage from './pages/adminpages/TableManagementPage'
import ProductManagementPage from './pages/adminpages/ProductManagementPage'
import CategoryManagementPage from './pages/adminpages/CategoryManagementPage'
import OrderManagementPage from './pages/adminpages/OrderManagementPage'
import UserManagementPage from './pages/adminpages/UserManagementPage'
import DashBoard from './pages/adminpages/DashBoard'
import './App.css'
import './style.css'

function App() {
  const loadUser = useAuthStore((state) => state.loadUser)
  const fetchCart = useCartStore((state) => state.fetchCart)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route
            path="/tables"
            element={
              <ProtectedRoute>
                <TablesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tables"
            element={
              <ProtectedRoute requiredRole="admin">
                <TableManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <DashBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requiredRole="admin">
                <ProductManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requiredRole="admin">
                <CategoryManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requiredRole={["admin", "staff"]}>
                <OrderManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
