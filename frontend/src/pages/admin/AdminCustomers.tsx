import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Users, 
  Search, 
  MessageSquare, 
  IndianRupee, 
  Award
} from 'lucide-react';

interface Customer {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  address: string;
}

export function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
  });

  // Filter based on search query
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // Formatter for currency
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgSpent = customers.length > 0 ? totalSpentAll / customers.length : 0;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-zinc-100 rounded-2xl" />
          <div className="h-28 bg-zinc-100 rounded-2xl" />
          <div className="h-28 bg-zinc-100 rounded-2xl" />
        </div>
        <div className="h-10 w-full md:w-80 bg-zinc-200 rounded-xl" />
        <div className="h-96 bg-zinc-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-zinc-900 flex items-center gap-2">
          Customer Database
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Detailed history of customers who placed orders on Neralla Inti Ruchulu.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Customers
            </span>
            <h3 className="text-2xl font-bold font-headline text-zinc-900 mt-0.5">
              {customers.length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <h3 className="text-2xl font-bold font-headline text-zinc-900 mt-0.5">
              {formatINR(totalSpentAll)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Avg Spent / Customer
            </span>
            <h3 className="text-2xl font-bold font-headline text-zinc-900 mt-0.5">
              {formatINR(avgSpent)}
            </h3>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="text-xs text-zinc-400 font-medium self-end md:self-auto">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
        {filteredCustomers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-center">Total Orders</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-right">Total Spent</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Last Order</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Loyalty Segment</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredCustomers.map((customer, idx) => {
                    // Loyalty Tag logic
                    let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                    let badgeText = 'New';
                    
                    if (customer.totalOrders >= 5) {
                      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
                      badgeText = 'VIP';
                    } else if (customer.totalOrders >= 3) {
                      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                      badgeText = 'Regular';
                    }

                    const formattedDate = new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-zinc-900">{customer.name}</div>
                          <div className="text-xs text-zinc-400 max-w-[200px] truncate" title={customer.address}>
                            {customer.address}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 font-medium">
                          {customer.phone}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-semibold text-zinc-700">
                          {customer.totalOrders}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-zinc-900">
                          {formatINR(customer.totalSpent)}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a
                            href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 transition-all"
                            title="Open WhatsApp Chat"
                          >
                            <MessageSquare className="h-4.5 w-4.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-zinc-100">
              {filteredCustomers.map((customer, idx) => {
                let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                let badgeText = 'New';
                if (customer.totalOrders >= 5) {
                  badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
                  badgeText = 'VIP';
                } else if (customer.totalOrders >= 3) {
                  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  badgeText = 'Regular';
                }

                const formattedDate = new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={idx} className="p-4 space-y-2.5 hover:bg-zinc-50/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-zinc-950 text-sm">{customer.name}</p>
                        <p className="text-xs text-zinc-500">{customer.phone}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-400 font-medium">Total Orders:</span>{' '}
                        <span className="font-bold text-zinc-700">{customer.totalOrders}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-medium">Total Spent:</span>{' '}
                        <span className="font-bold text-primary">{formatINR(customer.totalSpent)}</span>
                      </div>
                    </div>

                    {customer.address && (
                      <div className="text-xs text-zinc-500 border-t border-zinc-100/50 pt-2">
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Address</span>
                        <p className="line-clamp-2 leading-relaxed">{customer.address}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-100/50 text-[10px] text-zinc-400">
                      <span>Last Order: {formattedDate}</span>
                      <a
                        href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all"
                        title="Open WhatsApp Chat"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Users className="h-12 w-12 text-zinc-200 mb-3" />
            <p className="text-sm font-semibold text-zinc-500">No customers found</p>
            <p className="text-xs text-zinc-400 mt-1">Try matching another search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
