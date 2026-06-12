import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Users,
  MapPin,
  MessageSquare,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/delivery-zones', icon: MapPin, label: 'Delivery Zones' },
  { to: '/admin/testimonials', icon: MessageSquare, label: 'Testimonials' },
  { to: '/admin/expenses', icon: Wallet, label: 'Expenses' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout() {
  const { isAuthenticated, user, logout } = useAdminStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: pendingData } = useQuery<{ count: number }>({
    queryKey: ['pending-count'],
    queryFn: async () => {
      const res = await api.get('/orders/pending-count');
      return res.data;
    },
    refetchInterval: 30000,
  });
  const pendingCount = pendingData?.count ?? 0;

  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      <div className="px-5 py-5 border-b border-border/30 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Neralla Inti Ruchulu Logo"
          className="h-10 w-10 object-contain rounded-full shadow-sm"
        />
        <div>
          <h1 className="font-headline font-bold text-sm text-primary leading-tight">
            Neralla Inti Ruchulu
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              {to === '/admin/orders' && pendingCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border/30">
        <div className="flex items-center gap-2 px-3 py-2 mb-2 text-xs text-muted-foreground">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {user?.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-xs truncate">{user?.username}</p>
            <p className="text-muted-foreground text-[10px]">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50 animate-fade-in">
      {/* Mobile Top Navbar */}
      <header className="lg:hidden flex h-14 bg-card border-b border-border/50 items-center justify-between px-4 sticky top-0 z-40 shadow-sm shrink-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Neralla Inti Ruchulu Logo"
            className="h-8 w-8 object-contain rounded-full shadow-sm"
          />
          <h1 className="font-headline font-bold text-xs text-primary leading-tight">
            Neralla Inti Ruchulu
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs select-none">
          {user?.username[0].toUpperCase()}
        </div>
      </header>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 border-r border-border/50 flex-col shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Slide-out Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          {/* Drawer Panel */}
          <div className="relative flex w-64 max-w-xs flex-col bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="h-full">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
