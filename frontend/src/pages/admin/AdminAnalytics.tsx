import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  Calendar,
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface Overview {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingOrders: number;
  mtdRevenue: number;
  mtdOrders: number;
  statusCounts: Record<string, number>;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

interface ProductPerformance {
  name: string;
  quantity: number;
  revenue: number;
  orders: number;
}

export function AdminAnalytics() {
  const { data: overview, isLoading: isOverviewLoading } = useQuery<Overview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    },
  });

  const { data: monthlyData = [], isLoading: isMonthlyLoading } = useQuery<MonthlyRevenue[]>({
    queryKey: ['analytics-monthly'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue-by-month');
      return res.data;
    },
  });

  const { data: productPerformance = [], isLoading: isProductsLoading } = useQuery<ProductPerformance[]>({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const res = await api.get('/analytics/product-performance');
      return res.data;
    },
  });

  const isLoading = isOverviewLoading || isMonthlyLoading || isProductsLoading;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-zinc-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-100 rounded-2xl" />
          <div className="h-80 bg-zinc-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Format currency
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Pie chart data prep
  const statusColors: Record<string, string> = {
    'Pending Approval': '#f59e0b', // Amber
    'Confirmed': '#3b82f6',        // Blue
    'Preparing': '#a855f7',        // Purple
    'Out For Delivery': '#06b6d4', // Cyan
    'Delivered': '#10b981',        // Green
    'Cancelled': '#ef4444',        // Red
  };

  const pieData = overview?.statusCounts
    ? Object.entries(overview.statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: statusColors[status] || '#6b7280'
      }))
    : [];

  // Top 5 Products Bar Chart Data prep
  const barData = [...productPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const kpis = [
    {
      title: 'Total Revenue',
      value: formatINR(overview?.totalRevenue ?? 0),
      icon: IndianRupee,
      bg: 'bg-emerald-50 text-emerald-600',
      description: 'Lifetime approved order value'
    },
    {
      title: 'Total Orders',
      value: overview?.totalOrders ?? 0,
      icon: ShoppingBag,
      bg: 'bg-blue-50 text-blue-600',
      description: 'Approved & active orders'
    },
    {
      title: 'Avg Order Value',
      value: formatINR(overview?.avgOrderValue ?? 0),
      icon: TrendingUp,
      bg: 'bg-amber-50 text-amber-600',
      description: 'Average spent per order'
    },
    {
      title: 'MTD Revenue',
      value: formatINR(overview?.mtdRevenue ?? 0),
      icon: Calendar,
      bg: 'bg-primary/5 text-primary',
      description: 'Month-to-date sales'
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-zinc-900 flex items-center gap-2">
          Business Analytics
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Detailed overview of sales performance, customer metrics, and product performance.
        </p>
      </div>

      {/* Pending Banner Alert if there are orders needing action */}
      {overview && overview.pendingOrders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1 text-sm font-medium">
            There are <span className="font-bold">{overview.pendingOrders} pending approval</span> orders. Approve them to include their metrics in the totals.
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <h3 className="text-xl md:text-2xl font-bold font-headline text-zinc-900 mt-1">
                  {kpi.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-50">
              {kpi.description}
            </p>
          </div>
        ))}
      </div>

      {/* Line Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 mb-6">Revenue Trend (Last 6 Months)</h2>
        <div className="h-80 w-full">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip 
                  formatter={(val: any) => [formatINR(Number(val)), 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f4f4f5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3c1611" // Primary Maroon
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4, fill: '#3c1611' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400 flex-col gap-2">
              <TrendingUp className="h-10 w-10 text-zinc-300" />
              <span className="text-sm">No sales trends data available yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Status & Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Order Status Distribution</h2>
          <div className="h-72 w-full relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 flex-col gap-2">
                <PackageCheck className="h-10 w-10 text-zinc-300" />
                <span className="text-sm">No orders registered yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Top Products */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Top 5 Products (by Revenue)</h2>
          <div className="h-72 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} width={120} />
                  <Tooltip 
                    formatter={(val: any) => [formatINR(Number(val)), 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f4f4f5' }}
                  />
                  <Bar dataKey="revenue" fill="#5d8a3c" radius={[0, 8, 8, 0]} barSize={20}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3c1611' : '#5d8a3c'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 flex-col gap-2">
                <ShoppingBag className="h-10 w-10 text-zinc-300" />
                <span className="text-sm">No product sales logged yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
