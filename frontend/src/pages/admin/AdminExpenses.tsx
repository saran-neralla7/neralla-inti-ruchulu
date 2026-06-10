import { useState } from 'react';
import { Plus, Trash2, Calendar, IndianRupee, Tag, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useModalStore } from '@/store/modalStore';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

const EXPENSE_CATEGORIES = [
  'Ingredients',
  'Packaging',
  'Gas & Utilities',
  'Marketing',
  'Other',
];

const CATEGORY_COLORS: Record<string, string> = {
  Ingredients: 'bg-red-50 text-red-700 border-red-200',
  Packaging: 'bg-blue-50 text-blue-700 border-blue-200',
  'Gas & Utilities': 'bg-amber-50 text-amber-700 border-amber-200',
  Marketing: 'bg-purple-50 text-purple-700 border-purple-200',
  Other: 'bg-zinc-50 text-zinc-700 border-zinc-200',
};

export function AdminExpenses() {
  const queryClient = useQueryClient();
  const { showConfirm } = useModalStore();
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ingredients');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['admin-expenses'],
    queryFn: async () => {
      const res = await api.get('/admin/expenses');
      return res.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/expenses', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
    },
  });

  const resetForm = () => {
    setAmount('');
    setCategory('Ingredients');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    createMutation.mutate({
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date).toISOString(),
    });
  };

  const handleDelete = (expense: Expense) => {
    showConfirm({
      title: 'Delete Expense',
      description: `Are you sure you want to delete this expense of ₹${expense.amount} for "${expense.description}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(expense.id);
      },
    });
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const mtdExpenses = expenses
    .filter(exp => {
      const d = new Date(exp.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Find top expense category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Expense Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Log and audit raw materials, packaging, and utility expenses</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Log Expense
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses (Lifetime)</span>
            <IndianRupee className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">₹{totalExpenses.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-muted-foreground">Cumulative logged business expenses</p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Expenses (This Month)</span>
            <Calendar className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-bold text-foreground">₹{mtdExpenses.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-muted-foreground">Month-to-date business spending</p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Cost Center</span>
            <Tag className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{topCategory}</p>
          <p className="text-[11px] text-muted-foreground">Highest source of logged outflow</p>
        </div>
      </div>

      {/* Expense Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-card border border-border/60 rounded-2xl p-6 shadow-md space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h2 className="font-headline font-bold text-base text-foreground border-b border-border/40 pb-2">Log New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Amount (₹) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Bought 20kg Guntur red chilies"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Expense Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-2.5 pt-2">
            <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5 flex items-center gap-1">
              {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Save Expense
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl px-5 border border-border/80 text-muted-foreground">
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Expenses Table */}
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="font-headline font-bold text-sm text-foreground">Expense History</h3>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading expenses history...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 bg-muted/5">
            <FileText className="h-12 w-12 text-zinc-200" />
            <p className="text-sm font-semibold text-zinc-400 mt-2">No expenses logged yet</p>
            <p className="text-xs text-zinc-400 max-w-[280px] text-center">Log raw materials and operational costs to audit net profit margins.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3 text-xs font-bold text-zinc-500 text-right uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-xs font-bold text-zinc-500 text-right uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[exp.category] || 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{exp.description}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-foreground text-right">₹{exp.amount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(exp)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
