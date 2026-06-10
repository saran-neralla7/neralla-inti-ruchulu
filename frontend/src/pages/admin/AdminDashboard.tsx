import { Package, ShoppingBag, Tag, TrendingUp, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product, Category, Order } from '@/types';

export function AdminDashboard() {
  const { user } = useAdminStore();

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    },
  });

  // Fetch low-stock products
  const { data: lowStockProducts = [] } = useQuery<any[]>({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const res = await api.get('/products/low-stock');
      return res.data;
    },
  });

  // Fetch health check
  const { data: healthData, isError: isHealthError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get('/health');
      return res.data;
    },
    retry: 1,
    refetchInterval: 10000,
  });

  const pendingApprovalCount = orders.filter((o) => o.status === 'Pending Approval').length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const mtdRevenue = orders
    .filter((o) => {
      if (o.status === 'Cancelled' || o.status === 'Pending Approval') return false;
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, o) => {
      const orderTotal = o.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
      return sum + orderTotal;
    }, 0);

  const stats = [
    { label: 'Total Products', value: String(products.length), icon: Package, color: 'bg-primary/10 text-primary', link: '/admin/products' },
    { label: 'Categories', value: String(categories.length), icon: Tag, color: 'bg-secondary/10 text-secondary', link: '/admin/categories' },
    { label: 'Pending Approval', value: String(pendingApprovalCount), icon: ShoppingBag, color: 'bg-amber-100 text-amber-700', link: '/admin/orders' },
    { label: 'Revenue (MTD)', value: `₹${mtdRevenue.toFixed(0)}`, icon: TrendingUp, color: 'bg-blue-100 text-blue-700', link: '/admin/orders' },
  ];

  const isBackendRunning = !isHealthError && healthData?.status === 'ok';

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {user?.username} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Pending Approval Banner */}
      {pendingApprovalCount > 0 && (
        <Link
          to="/admin/orders"
          className="flex items-center gap-3 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group"
        >
          <div className="bg-amber-100 p-2 rounded-xl">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              {pendingApprovalCount} order{pendingApprovalCount > 1 ? 's' : ''} waiting for your approval
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              These are WhatsApp inquiries where payment needs to be confirmed. Click to review.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Low Stock Warning Alert */}
      {lowStockProducts.length > 0 && (
        <Link
          to="/admin/products"
          className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100/80 transition-colors group"
        >
          <div className="bg-red-100 p-2 rounded-xl text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">
              ⚠️ {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} running low on stock!
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Items: {lowStockProducts.slice(0, 3).map(p => `${p.name_en} (${p.stock} remaining)`).join(', ')}
              {lowStockProducts.length > 3 ? ' and others.' : '.'} Click to Restock.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-red-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all group"
          >
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/products', label: 'Add New Product' },
              { to: '/admin/categories', label: 'Manage Categories' },
              { to: '/admin/orders', label: 'View Orders' },
              { to: '/admin/analytics', label: 'Business Analytics' },
              { to: '/admin/customers', label: 'Customer Database' },
              { to: '/admin/delivery-zones', label: 'Delivery Zones' },
              { to: '/admin/testimonials', label: 'Testimonials Carousel' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-foreground group"
              >
                {item.label}
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Frontend</span>
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Running
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Backend API</span>
              <span className={`flex items-center gap-1.5 font-medium ${isBackendRunning ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isBackendRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                {isBackendRunning ? 'Running' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">PostgreSQL</span>
              <span className={`flex items-center gap-1.5 font-medium ${isBackendRunning ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isBackendRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                {isBackendRunning ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
          {isBackendRunning ? (
            <p className="text-xs text-green-700 mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
              ✓ Database and API are fully connected and operating properly.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              ⚠️ Database offline. Ensure PostgreSQL is started and API server is running on port 4000.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
