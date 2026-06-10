import { useState } from 'react';
import { Plus, Edit2, Trash2, Leaf, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Product, Category } from '@/types';
import { useModalStore } from '@/store/modalStore';
import { generateWhatsAppStatusImage } from '@/utils/generateWhatsAppStatusImage';

const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-100 text-green-700',
  'Out Of Stock': 'bg-red-100 text-red-700',
  'Coming Soon': 'bg-blue-100 text-blue-700',
  Seasonal: 'bg-amber-100 text-amber-700',
};

interface FormVariant {
  size: string;
  packaging: string;
  variantPrice: number;
  packagingCharge: number;
  costPrice: number;
}

export function AdminProducts() {
  const queryClient = useQueryClient();
  const { showConfirm, showAlert } = useModalStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nameEN, setNameEN] = useState('');
  const [nameTE, setNameTE] = useState('');
  const [descEN, setDescEN] = useState('');
  const [descTE, setDescTE] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [storage, setStorage] = useState('');
  const [shelfLife, setShelfLife] = useState('12 Months');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('Available');
  const [label, setLabel] = useState('');
  const [spice, setSpice] = useState('medium');
  const [inventory, setInventory] = useState(0);
  const [rating, setRating] = useState('4.5');
  const [reviewCount, setReviewCount] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [variants, setVariants] = useState<FormVariant[]>([
    { size: '250g', packaging: 'Bottle', variantPrice: 150, packagingCharge: 20, costPrice: 60 },
  ]);

  // Temporary variant form state
  const [newVarSize, setNewVarSize] = useState('250g');
  const [newVarPkg, setNewVarPkg] = useState('Bottle');
  const [newVarPrice, setNewVarPrice] = useState(150);
  const [newVarCharge, setNewVarCharge] = useState(20);
  const [newVarCost, setNewVarCost] = useState(60);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/products', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
    onError: (err: any) => {
      console.error('Create product mutation error:', err);
      showAlert({
        title: 'Save Failed',
        description: err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to save product.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/products/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
    onError: (err: any) => {
      console.error('Update product mutation error:', err);
      showAlert({
        title: 'Update Failed',
        description: err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to update product.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/products/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const resetForm = () => {
    setNameEN('');
    setNameTE('');
    setDescEN('');
    setDescTE('');
    setIngredients('');
    setStorage('');
    setShelfLife('12 Months');
    setCategoryId('');
    setStatus('Available');
    setLabel('');
    setSpice('medium');
    setInventory(0);
    setRating('4.5');
    setReviewCount('10');
    setImageUrl('');
    setVariants([{ size: '250g', packaging: 'Bottle', variantPrice: 150, packagingCharge: 20, costPrice: 60 }]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setNameEN(product.name_en);
    setNameTE(product.name_te);
    setDescEN(product.description_en || '');
    setDescTE(product.description_te || '');
    setIngredients(product.ingredients || '');
    setStorage(product.storage || '');
    setShelfLife(product.shelfLife || '12 Months');
    setCategoryId(product.categoryId);
    setStatus(product.status);
    setLabel(product.label || '');
    setSpice(product.spice || 'medium');
    setInventory(product.inventory);
    setRating((product.rating ?? 4.5).toString());
    setReviewCount((product.reviewCount ?? 10).toString());
    setImageUrl(product.gallery?.[0] || '');
    setVariants(
      product.variants.map((v) => ({
        size: v.size,
        packaging: v.packaging,
        variantPrice: v.variantPrice,
        packagingCharge: v.packagingCharge,
        costPrice: v.costPrice ?? 0,
      }))
    );
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert({
        title: 'File Too Large',
        description: 'Please select an image smaller than 2MB to ensure good performance.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: newVarSize,
        packaging: newVarPkg,
        variantPrice: Number(newVarPrice) || 0,
        packagingCharge: Number(newVarCharge) || 0,
        costPrice: Number(newVarCost) || 0,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!nameEN || !categoryId) {
      showAlert({
        title: 'Validation Error',
        description: 'Please enter a product name and select a category.',
      });
      return;
    }

    const payload = {
      categoryId,
      name_en: nameEN,
      name_te: nameTE,
      description_en: descEN,
      description_te: descTE,
      ingredients,
      storage,
      shelfLife,
      status,
      label: label || null,
      spice,
      inventory: Number(inventory) || 0,
      rating: Number(rating) || 4.5,
      reviewCount: Number(reviewCount) || 10,
      gallery: imageUrl ? [imageUrl] : [],
      variants,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Delete Product',
      description: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id);
      },
    });
  };

  const handleToggleStatus = (product: Product) => {
    const nextStatus = product.status === 'Available' ? 'Out Of Stock' : 'Available';
    toggleStatusMutation.mutate({ id: product.id, status: nextStatus });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} products total</p>
        </div>
        <Button
          onClick={() => {
            if (categories.length > 0 && !categoryId) {
              setCategoryId(categories[0].id);
            }
            setShowForm(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 bg-card border border-border/50 rounded-2xl p-6 shadow-md space-y-6">
          <h2 className="font-headline text-lg font-semibold text-primary border-b border-border pb-3">
            {editingId ? 'Edit Product' : 'New Product'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Name (English)</label>
              <input
                type="text"
                value={nameEN}
                onChange={(e) => setNameEN(e.target.value)}
                placeholder="e.g. Avakaya (Raw Mango Pickle)"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Name (Telugu)</label>
              <input
                type="text"
                value={nameTE}
                onChange={(e) => setNameTE(e.target.value)}
                placeholder="e.g. అవకాయ"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-telugu"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description (English)</label>
              <textarea
                value={descEN}
                onChange={(e) => setDescEN(e.target.value)}
                placeholder="Short English description..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description (Telugu)</label>
              <textarea
                value={descTE}
                onChange={(e) => setDescTE(e.target.value)}
                placeholder="తెలుగులో వివరణ..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-telugu"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Ingredients</label>
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. Mango pieces, Sesame oil, Chilli powder..."
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Shelf Life</label>
              <input
                type="text"
                value={shelfLife}
                onChange={(e) => setShelfLife(e.target.value)}
                placeholder="e.g. 12 Months"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en} ({c.name_te})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {['Available', 'Out Of Stock', 'Coming Soon', 'Seasonal'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Label (optional)</label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">None</option>
                {['Bestseller', 'New Arrival', 'Seasonal'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Spice Level</label>
              <select
                value={spice}
                onChange={(e) => setSpice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="mild">Mild / Sweet (కారం తక్కువ / తీపి)</option>
                <option value="medium">Medium Spicy (మధ్యమ కారం)</option>
                <option value="fire">Andhra Fire - High (ఆంధ్రా ఫైర్ - కారం ఎక్కువ)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Inventory (Stock Count)</label>
              <input
                type="number"
                value={inventory}
                onChange={(e) => setInventory(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Rating (0 - 5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Review Count</label>
              <input
                type="number"
                min="0"
                value={reviewCount}
                onChange={(e) => setReviewCount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Storage Instructions</label>
              <textarea
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="e.g. Store in a cool, dry place... (use newlines for separate instructions)"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            
            <div className="md:col-span-2 border-t border-border/30 pt-4 mt-2">
              <label className="text-sm font-medium text-foreground mb-2.5 block">Product Image</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2 space-y-3">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL (e.g. https://images.unsplash.com/photo-...) or choose a file below"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors border border-border/50">
                      <span>Choose File / Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs text-destructive hover:underline font-semibold"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-center md:justify-start">
                  <div className="relative w-24 h-24 border border-border/85 rounded-xl overflow-hidden bg-muted flex items-center justify-center shadow-inner">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/150x150?text=Invalid+URL';
                        }}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <span className="text-[10px] text-muted-foreground block font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants section */}
          <div className="border border-border/80 rounded-xl p-4 bg-muted/10 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Product Variants</h3>

            {/* List of current variants */}
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between bg-card p-3 rounded-lg border border-border/50 text-sm">
                  <div className="flex gap-4">
                    <span>
                      <strong>Size:</strong> {v.size}
                    </span>
                    <span>
                      <strong>Pkg:</strong> {v.packaging}
                    </span>
                    <span className="text-primary font-semibold">₹{v.variantPrice}</span>
                    <span className="text-muted-foreground">Charge: ₹{v.packagingCharge}</span>
                    <span className="text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">Cost: ₹{v.costPrice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(i)}
                    className="text-destructive hover:text-destructive/80 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add variant sub-form */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-3 border-t border-border/20">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Size</label>
                <input
                  type="text"
                  value={newVarSize}
                  onChange={(e) => setNewVarSize(e.target.value)}
                  placeholder="e.g. 250g, 1kg"
                  className="w-full px-2 py-1 rounded border border-border text-xs bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Packaging</label>
                <input
                  type="text"
                  value={newVarPkg}
                  onChange={(e) => setNewVarPkg(e.target.value)}
                  placeholder="Bottle, Packet..."
                  className="w-full px-2 py-1 rounded border border-border text-xs bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newVarPrice}
                  onChange={(e) => setNewVarPrice(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-border text-xs bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Pkg Charge (₹)</label>
                <input
                  type="number"
                  value={newVarCharge}
                  onChange={(e) => setNewVarCharge(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-border text-xs bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  value={newVarCost}
                  onChange={(e) => setNewVarCost(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-border text-xs bg-background"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddVariant}
                  variant="outline"
                  className="w-full h-8 text-xs font-semibold hover:bg-primary/5 hover:text-primary"
                >
                  Add Variant
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/30">
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Product'}
            </Button>
            <Button variant="outline" onClick={resetForm} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Products table */}
      {productsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading products...</p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/40">
                <tr>
                  {['Product', 'Status', 'Label', 'Variants', 'Stock', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          {product.gallery?.[0] ? (
                            <img src={product.gallery[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Leaf className="h-4 w-4 text-primary/40" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name_en}</p>
                          <p className="text-xs text-muted-foreground">{product.name_te}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full font-medium transition-colors hover:scale-105',
                          STATUS_COLORS[product.status]
                        )}
                      >
                        {product.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{product.label || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{product.variants?.length || 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{product.inventory}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => generateWhatsAppStatusImage(product)}
                          className="h-8 w-8 hover:text-amber-600 hover:bg-amber-50"
                          title="Generate WhatsApp Status Graphic"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          className="h-8 w-8 hover:text-primary hover:bg-primary/5"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive hover:bg-destructive/5"
                          onClick={() => handleDelete(product.id)}
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
        </div>
      )}
    </div>
  );
}
