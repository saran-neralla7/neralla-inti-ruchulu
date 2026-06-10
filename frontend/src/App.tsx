import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { About } from './pages/About';
import { ProductDetail } from './pages/ProductDetail';
import { OrderSuccess } from './pages/OrderSuccess';
import { Offline } from './pages/Offline';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminDeliveryZones } from './pages/admin/AdminDeliveryZones';
import { AdminTestimonials } from './pages/admin/AdminTestimonials';
import { AdminExpenses } from './pages/admin/AdminExpenses';
import { GlobalModal } from './components/ui/GlobalModal';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public storefront */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="about" element={<About />} />
            <Route path="order-success" element={<OrderSuccess />} />
            <Route path="offline" element={<Offline />} />
            <Route
              path="*"
              element={
                <div className="container py-20 text-center">
                  <h1 className="text-2xl font-bold font-headline text-primary">Page Not Found</h1>
                </div>
              }
            />
          </Route>

          {/* Admin panel */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="delivery-zones" element={<AdminDeliveryZones />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="expenses" element={<AdminExpenses />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        <GlobalModal />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
