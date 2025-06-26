import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import Apply from "./pages/Apply";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import DashboardProducts from "./pages/DashboardProducts";
import DashboardOrders from "./pages/DashboardOrders";
import DashboardInvoices from "./pages/DashboardInvoices";
import DashboardCustomers from "./pages/DashboardCustomers";
import DashboardStatistics from "./pages/DashboardStatistics";
import DashboardCategories from "./pages/DashboardCategories";
import DashboardUnits from "./pages/DashboardUnits";
import AdminProfile from "./pages/AdminProfile";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import ProductSetup from "./pages/ProductSetup";
import PasswordReset from "./pages/PasswordReset";
import DashboardDiscountGroups from "./pages/DashboardDiscountGroups";
import DashboardUniqueOffers from "./pages/DashboardUniqueOffers";
import AdminCustomerCreate from "./pages/AdminCustomerCreate";
import Profile from "./pages/Profile";
import CustomerUniqueOffers from "./pages/CustomerUniqueOffers";

// Developer-only components
import { SecureDeveloperRoute } from './components/dev/SecureDeveloperRoute';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            
            {/* Authentication routes */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/super/admin" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AdminLogin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/apply" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Apply />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/password-reset" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <PasswordReset />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin login redirect */}
            <Route 
              path="/admin-login" 
              element={<Navigate to="/super/admin" replace />} 
            />
            
            {/* Admin routes - Enhanced security for Netlify */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/applications" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardProducts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/categories" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardCategories />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/units" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardUnits />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products/new" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProductSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products/edit/:id" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProductSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/invoices" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardInvoices />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/customers" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardCustomers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/customers/new" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminCustomerCreate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/discount-groups" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardDiscountGroups />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/unique-offers" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardUniqueOffers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/statistics" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardStatistics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/profile" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardStatistics />
                </ProtectedRoute>
              } 
            />
            
            {/* Customer routes */}
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <Cart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/unique-offers" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <CustomerUniqueOffers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/dashboard" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy dashboard routes - redirect to customer */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/products" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <DashboardProducts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/categories" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <DashboardCategories />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/units" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <DashboardUnits />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/products/new" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <ProductSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/products/edit/:id" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <ProductSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/orders" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <DashboardOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/invoices" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <DashboardInvoices />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/customers" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <DashboardCustomers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/statistics" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <DashboardStatistics />
                </ProtectedRoute>
              } 
            />
            
            {/* Secure developer-only route - DO NOT SHARE */}
            <Route 
              path="/dev-dashboard/metrics-access-9e8d7f4a9c1b3e09d6f2a1bc2a7e" 
              element={<SecureDeveloperRoute />} 
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
