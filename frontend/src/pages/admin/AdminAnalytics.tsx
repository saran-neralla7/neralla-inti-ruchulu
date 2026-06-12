import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  Calendar,
  AlertCircle,
  PackageCheck,
  Percent,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  MessageSquare,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface PLSummary {
  grossRevenue: number;
  shippingCollected: number;
  totalInflow: number;
  totalCogs: number;
  totalActualShippingCost: number;
  gatewayFees: number;
  totalExpenses: number;
  netProfit: number;
  netProfitMargin: number;
}

interface PLReport {
  summary: PLSummary;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
  ordersCount: number;
}

export function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<'sales' | 'pl'>('sales');
  
  // Date filters for P&L
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Copy status for P&L share
  const [copiedPL, setCopiedPL] = useState(false);

  // Fetch sales overview
  const { data: overview, isLoading: isOverviewLoading } = useQuery<Overview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    },
  });

  // Fetch monthly trends
  const { data: monthlyData = [], isLoading: isMonthlyLoading } = useQuery<MonthlyRevenue[]>({
    queryKey: ['analytics-monthly'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue-by-month');
      return res.data;
    },
  });

  // Fetch product performance
  const { data: productPerformance = [], isLoading: isProductsLoading } = useQuery<ProductPerformance[]>({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const res = await api.get('/analytics/product-performance');
      return res.data;
    },
  });

  // Fetch P&L report
  const { data: plReport, isLoading: isPLLoading } = useQuery<PLReport>({
    queryKey: ['profit-loss-report', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/admin/reports/profit-loss', {
        params: { 
          startDate: startDate ? new Date(startDate).toISOString() : undefined, 
          endDate: endDate ? new Date(endDate).toISOString() : undefined 
        },
      });
      return res.data;
    },
  });

  const isLoading = isOverviewLoading || isMonthlyLoading || isProductsLoading || isPLLoading;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 w-full bg-zinc-100 rounded-2xl" />
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

  // Group P&L outflows for Pie Chart
  const expenseGroupTotals: Record<string, number> = {};
  if (plReport) {
    plReport.expenses.forEach(exp => {
      expenseGroupTotals[exp.category] = (expenseGroupTotals[exp.category] || 0) + exp.amount;
    });
    if (plReport.summary.totalCogs > 0) {
      expenseGroupTotals['COGS (Ingredients)'] = plReport.summary.totalCogs;
    }
    if (plReport.summary.totalActualShippingCost > 0) {
      expenseGroupTotals['Shipping Paid'] = plReport.summary.totalActualShippingCost;
    }
    if (plReport.summary.gatewayFees > 0) {
      expenseGroupTotals['Gateway Fees'] = plReport.summary.gatewayFees;
    }
  }

  const plExpenseColors: Record<string, string> = {
    'COGS (Ingredients)': '#3c1611',
    'Shipping Paid': '#06b6d4',
    'Gateway Fees': '#6b7280',
    Ingredients: '#ef4444',
    Packaging: '#3b82f6',
    'Gas & Utilities': '#f59e0b',
    Marketing: '#a855f7',
    Other: '#10b981',
  };

  const plPieData = Object.entries(expenseGroupTotals).map(([name, value]) => ({
    name,
    value,
    color: plExpenseColors[name] || '#6b7280'
  }));

  const handleQuickDateFilter = (type: 'this-month' | 'last-30' | 'lifetime') => {
    const now = new Date();
    if (type === 'this-month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'last-30') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleSharePLSummary = () => {
    if (!plReport) return;
    
    const summary = plReport.summary;
    const startStr = startDate ? new Date(startDate).toLocaleDateString('en-IN') : 'Beginning';
    const endStr = endDate ? new Date(endDate).toLocaleDateString('en-IN') : 'Present';
    
    const totalOutflow = summary.totalCogs + summary.totalActualShippingCost + summary.gatewayFees + summary.totalExpenses;
    
    const text = `📊 *NERALLA INTI RUCHULU - P&L STATEMENT* 📊\n📅 *Period:* ${startStr} to ${endStr}\n\n🟢 *INFLOW (Revenue):*\n- Product Sales: ₹${summary.grossRevenue.toLocaleString('en-IN')}\n- Shipping Fees: ₹${summary.shippingCollected.toLocaleString('en-IN')}\n*Total Inflow (A):* ₹${summary.totalInflow.toLocaleString('en-IN')}\n\n🔴 *OUTFLOW (Costs):*\n- COGS (Ingredients): ₹${summary.totalCogs.toLocaleString('en-IN')}\n- Courier Shipping: ₹${summary.totalActualShippingCost.toLocaleString('en-IN')}\n- Payment Gateway Fees: ₹${summary.gatewayFees.toLocaleString('en-IN')}\n- Bulk Expenses: ₹${summary.totalExpenses.toLocaleString('en-IN')}\n*Total Outflow (B):* ₹${totalOutflow.toLocaleString('en-IN')}\n\n💰 *NET PROFIT (A - B):* ₹${summary.netProfit.toLocaleString('en-IN')}\n📈 *NET MARGIN:* ${summary.netProfitMargin.toFixed(1)}%\n\nShared from Admin Panel.`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPL(true);
      setTimeout(() => setCopiedPL(false), 2000);
      
      const encoded = encodeURIComponent(text);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }).catch(err => {
      console.error('Copy/Share failed:', err);
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-zinc-900 flex items-center gap-2">
            Business Analytics
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Detailed overview of sales performance, profit margins, and cost centers.
          </p>
        </div>

        {/* Tabs switcher */}
        <div className="flex bg-muted p-1 rounded-xl shrink-0 self-start sm:self-auto border border-border/50">
          <button
            onClick={() => setActiveTab('sales')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'sales'
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sales Overview
          </button>
          <button
            onClick={() => setActiveTab('pl')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'pl'
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Profit & Loss (P&L)
          </button>
        </div>
      </div>

      {/* Pending Banner Alert */}
      {overview && overview.pendingOrders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1 text-sm font-medium">
            There are <span className="font-bold">{overview.pendingOrders} pending approval</span> orders. Approve them to include their metrics in the totals.
          </div>
        </div>
      )}

      {/* SALES TAB */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="bg-card p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
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
                <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-50 font-medium">
                  {kpi.description}
                </p>
              </div>
            ))}
          </div>

          {/* Line Chart Section */}
          <div className="bg-card p-6 rounded-2xl border border-zinc-100 shadow-sm">
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
            <div className="bg-card p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
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
            <div className="bg-card p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
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
      )}

      {/* P&L TAB */}
      {activeTab === 'pl' && plReport && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Date Filters Control */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs bg-background focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs bg-background focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5 md:self-end pt-5 md:pt-0">
                <button
                  onClick={() => handleQuickDateFilter('this-month')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fff1ed] text-primary text-xs font-semibold hover:bg-primary/10 transition-colors border border-primary/10"
                >
                  This Month
                </button>
                <button
                  onClick={() => handleQuickDateFilter('last-30')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fff1ed] text-primary text-xs font-semibold hover:bg-primary/10 transition-colors border border-primary/10"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => handleQuickDateFilter('lifetime')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fff1ed] text-primary text-xs font-semibold hover:bg-primary/10 transition-colors border border-primary/10"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted px-3 py-2 rounded-xl border border-border/30">
              <Filter className="h-3.5 w-3.5" />
              Showing metrics for: {startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'} to {endDate ? new Date(endDate).toLocaleDateString() : 'Present'}
            </div>
          </div>

          {/* P&L Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Inflow (Sales)</span>
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">₹{plReport.summary.totalInflow.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-muted-foreground">Gross Sales (₹{plReport.summary.grossRevenue}) + Shipping (₹{plReport.summary.shippingCollected})</p>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Outflow (Costs)</span>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₹{(plReport.summary.totalCogs + plReport.summary.totalActualShippingCost + plReport.summary.gatewayFees + plReport.summary.totalExpenses).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-muted-foreground">All COGS, courier costs, gateway fees & logged expenses</p>
            </div>

            <div className={cn(
              "bg-card border rounded-2xl p-5 shadow-sm space-y-2",
              plReport.summary.netProfit >= 0 ? 'border-emerald-200 bg-emerald-50/10' : 'border-red-200 bg-red-50/10'
            )}>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
                <Percent className="h-4 w-4 text-primary" />
              </div>
              <p className={cn(
                "text-2xl font-bold",
                plReport.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
              )}>
                ₹{plReport.summary.netProfit.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Net Margin: <span className="font-bold">{plReport.summary.netProfitMargin.toFixed(1)}%</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: P&L Statement Grid */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-headline font-bold text-base text-zinc-950">Profit & Loss Statement</h2>
                  <p className="text-xs text-muted-foreground">Detailed balance list of income and expenses</p>
                </div>
                <Button
                  onClick={handleSharePLSummary}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-9 px-3.5 flex items-center gap-1.5 shadow-sm transition-all"
                  title="Share monthly P&L summary on WhatsApp"
                >
                  {copiedPL ? <Check className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  {copiedPL ? 'Copied & Shared!' : 'Share P&L Summary'}
                </Button>
              </div>

              <div className="space-y-4 text-sm font-medium">
                {/* INFLOWS */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider pb-1 border-b border-emerald-100">1. Operating Inflow (Revenue)</h3>
                  <div className="flex justify-between items-center text-zinc-700 py-1 font-normal">
                    <span>Product Revenue (Gross Sales)</span>
                    <span>₹{plReport.summary.grossRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-700 py-1 font-normal">
                    <span>Shipping Fees Collected</span>
                    <span>₹{plReport.summary.shippingCollected.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-800 py-1.5 font-bold border-t border-dashed border-emerald-200 bg-emerald-50/20 px-2 rounded">
                    <span>Total Inflow (A)</span>
                    <span>₹{plReport.summary.totalInflow.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* OUTFLOWS */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider pb-1 border-b border-red-100">2. Operating Outflow (Expenses)</h3>
                  <div className="flex justify-between items-center text-zinc-700 py-1 font-normal">
                    <span>Cost of Goods Sold (COGS)</span>
                    <span>- ₹{plReport.summary.totalCogs.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-700 py-1 font-normal">
                    <span>Courier Shipping Costs</span>
                    <span>- ₹{plReport.summary.totalActualShippingCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-700 py-1 font-normal">
                    <span>Payment Gateway Fees (2%)</span>
                    <span>- ₹{plReport.summary.gatewayFees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-700 py-1 font-normal">
                    <span>Logged Bulk/Operating Expenses</span>
                    <span>- ₹{plReport.summary.totalExpenses.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-800 py-1.5 font-bold border-t border-dashed border-red-200 bg-red-50/20 px-2 rounded">
                    <span>Total Outflow (B)</span>
                    <span>
                      - ₹{(plReport.summary.totalCogs + plReport.summary.totalActualShippingCost + plReport.summary.gatewayFees + plReport.summary.totalExpenses).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* NET */}
                <div className="border-t-2 border-double border-border pt-4">
                  <div className={cn(
                    "flex justify-between items-center p-3 rounded-xl font-bold text-base border",
                    plReport.summary.netProfit >= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                  )}>
                    <span>Net Profit (A - B)</span>
                    <span>₹{plReport.summary.netProfit.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Outflow Cost Centers Breakdown (Pie Chart) */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h2 className="font-headline font-bold text-base text-zinc-950">Expense Distribution</h2>
                <p className="text-xs text-muted-foreground">Outflow breakdown by cost category</p>
              </div>
              
              <div className="h-72 w-full relative mt-4">
                {plPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={plPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {plPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                      <Legend verticalAlign="bottom" height={42} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 flex-col gap-2">
                    <TrendingDown className="h-10 w-10 text-zinc-300" />
                    <span className="text-sm">No expenses or outflows recorded yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
