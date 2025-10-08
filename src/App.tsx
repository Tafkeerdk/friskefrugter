import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { CartProvider } from "./hooks/useCart";
import { ProtectedRoute } from "./components/auth";
import ScrollToTop from "./components/layout/ScrollToTop";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import Admin from "./pages/Admin";
import Apply from "./pages/Apply";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import DashboardProducts from "./pages/DashboardProducts";
import DashboardOrders from "./pages/DashboardOrders";
import DashboardInvoices from "./pages/DashboardInvoices";
import DashboardCustomers from "./pages/DashboardCustomers";
import DashboardCustomerCarts from "./pages/DashboardCustomerCarts";
import DashboardStatistics from "./pages/DashboardStatistics";
import DashboardCategories from "./pages/DashboardCategories";
import DashboardUnits from "./pages/DashboardUnits";
import AdminProfile from "./pages/AdminProfile";
import Contact from "./pages/Contact";
import ContactSuccess from "./pages/ContactSuccess";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import ProductSetup from "./pages/ProductSetup";
import PasswordReset from "./pages/PasswordReset";
import DashboardOfferGroupPrices from "./pages/DashboardOfferGroupPrices";
import DashboardUniqueOffers from "./pages/DashboardUniqueOffers";
import DashboardFeaturedProducts from "./pages/DashboardFeaturedProducts";
import DashboardHenvendelser from "./pages/DashboardHenvendelser";
import DashboardApplications from "./pages/DashboardApplications";
import DashboardApplicationDetail from "./pages/DashboardApplicationDetail";
import DashboardNotifications from "./pages/DashboardNotifications";
import DashboardContactDetail from "./pages/DashboardContactDetail";
import AdminCustomerCreate from "./pages/AdminCustomerCreate";
import DashboardTilbudsgrupper from "./pages/DashboardTilbudsgrupper";
import Profile from "./pages/Profile";
import CustomerUniqueOffers from "./pages/CustomerUniqueOffers";
import CustomerOrders from "./pages/CustomerOrders";
import OrderSuccess from "./pages/OrderSuccess";

// Developer-only components
import { SecureDeveloperRoute } from './components/dev/SecureDeveloperRoute';

// Visitor tracking
import { useVisitorTracking } from './hooks/useVisitorTracking';

const queryClient = new QueryClient();

// Main App component with visitor tracking
const AppContent = () => {
  // Track visitor page views for analytics
  useVisitorTracking();

  return (
    <>
          {/* 🚀 SCROLL TO TOP FIX - Automatically scrolls to top on all route changes */}
          <ScrollToTop smooth={true} delay={0} />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/contact/success" element={<ContactSuccess />} />
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
                  <DashboardApplications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/applications/:id" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardApplicationDetail />
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
              path="/admin/featured-products" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardFeaturedProducts />
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
              path="/admin/orders/:orderId" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminOrderDetail />
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
              path="/admin/customer-carts" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardCustomerCarts />
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
              path="/admin/customers/tilbudsgrupper" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardTilbudsgrupper />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/discount-groups" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardOfferGroupPrices />
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
              path="/admin/henvendelser" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardHenvendelser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/henvendelser/:id" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardContactDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/notifications" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardNotifications />
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
              path="/orders" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <CustomerOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/order/success" 
              element={
                <ProtectedRoute requireCustomer={true}>
                  <OrderSuccess />
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
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppContent />
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
