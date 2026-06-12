import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category } from '@/types';
import { useModalStore } from '@/store/modalStore';

export function AdminCategories() {
  const queryClient = useQueryClient();
  const { showConfirm } = useModalStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameEN, setNameEN] = useState('');
  const [nameTE, setNameTE] = useState('');

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Create Category mutation
  const createMutation = useMutation({
    mutationFn: async (newCat: { name_en: string; name_te: string; order: number }) => {
      const res = await api.post('/categories', newCat);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      resetForm();
    },
  });

  // Update Category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name_en: string; name_te: string; order: number } }) => {
      const res = await api.put(`/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      resetForm();
    },
  });

  // Delete Category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Category sorting swap mutation
  const moveMutation = useMutation({
    mutationFn: async ({ catA, catB }: { catA: Category; catB: Category }) => {
      await Promise.all([
        api.put(`/categories/${catA.id}`, { name_en: catA.name_en, name_te: catA.name_te, order: catA.order }),
        api.put(`/categories/${catB.id}`, { name_en: catB.name_en, name_te: catB.name_te, order: catB.order }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    
    const catA = categories[index];
    const catB = categories[targetIndex];
    
    let orderA = catB.order;
    let orderB = catA.order;
    if (orderA === orderB) {
      orderA = direction === 'up' ? catB.order - 1 : catB.order + 1;
    }
    
    moveMutation.mutate({
      catA: { ...catA, order: orderA },
      catB: { ...catB, order: orderB }
    });
  };

  const resetForm = () => {
    setNameEN('');
    setNameTE('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameEN(cat.name_en);
    setNameTE(cat.name_te);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!nameEN) return;
    const data = {
      name_en: nameEN,
      name_te: nameTE,
      order: editingId
        ? (categories.find((c) => c.id === editingId)?.order ?? categories.length)
        : categories.length + 1,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Delete Category',
      description: 'Are you sure you want to delete this category? This will affect products in this category and cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id);
      },
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories total</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name (English)</label>
              <input
                value={nameEN}
                onChange={(e) => setNameEN(e.target.value)}
                placeholder="e.g. Pickles"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Name (Telugu)</label>
              <input
                value={nameTE}
                onChange={(e) => setNameTE(e.target.value)}
                placeholder="e.g. పచ్చళ్లు"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-border/30">
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary text-white rounded-xl"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading categories...</p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/40">
                <tr>
                  {['Sort', '#', 'Category (EN)', 'Category (TE)', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0 || moveMutation.isPending}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === categories.length - 1 || moveMutation.isPending}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cat.order}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{cat.name_en}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cat.name_te}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cat)}
                          className="h-8 w-8 hover:text-primary hover:bg-primary/5"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive hover:bg-destructive/5"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-border/30">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                      #{cat.order}
                    </span>
                    <p className="font-bold text-foreground text-sm">{cat.name_en}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-telugu pl-8">{cat.name_te}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0 || moveMutation.isPending}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border/30"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === categories.length - 1 || moveMutation.isPending}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border/30"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-0.5 border-l border-border/30 pl-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cat)}
                      className="h-8 w-8 hover:text-primary"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
