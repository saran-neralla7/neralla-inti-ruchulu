import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories</p>
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
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/40">
              <tr>
                {['#', 'Category (EN)', 'Category (TE)', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{cat.order}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{cat.name_en}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cat.name_te}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
