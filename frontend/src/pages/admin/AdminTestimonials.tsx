import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useModalStore } from '@/store/modalStore';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  X,
  Check,
  MapPin,
  MessageSquare
} from 'lucide-react';

interface Testimonial {
  id: string;
  customer_name: string;
  location?: string | null;
  text: string;
  rating: number;
  is_active: boolean;
  createdAt: string;
}

export function AdminTestimonials() {
  const queryClient = useQueryClient();
  const { showConfirm, close: closeModal } = useModalStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Hover rating state for star selector
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Fetch Testimonials
  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ['testimonials-all'],
    queryFn: async () => {
      const res = await api.get('/testimonials/all');
      return res.data;
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newT: Omit<Testimonial, 'id' | 'createdAt'>) => {
      return await api.post('/testimonials', newT);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials-all'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials-active'] });
      handleCloseForm();
      showSuccessFeedback();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create testimonial');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (updated: Omit<Testimonial, 'createdAt'>) => {
      return await api.put(`/testimonials/${updated.id}`, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials-all'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials-active'] });
      handleCloseForm();
      showSuccessFeedback();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to update testimonial');
    }
  });

  // Toggle Visibility Mutation
  const toggleMutation = useMutation({
    mutationFn: async (testimonial: Testimonial) => {
      return await api.put(`/testimonials/${testimonial.id}`, {
        customer_name: testimonial.customer_name,
        location: testimonial.location,
        text: testimonial.text,
        rating: testimonial.rating,
        is_active: !testimonial.is_active,
        id: testimonial.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials-all'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials-active'] });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/testimonials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials-all'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials-active'] });
    }
  });

  const showSuccessFeedback = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleOpenAddForm = () => {
    setEditingTestimonial(null);
    setCustomerName('');
    setLocation('');
    setText('');
    setRating(5);
    setIsActive(true);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (t: Testimonial) => {
    setEditingTestimonial(t);
    setCustomerName(t.customer_name);
    setLocation(t.location || '');
    setText(t.text);
    setRating(t.rating);
    setIsActive(t.is_active);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTestimonial(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) return setFormError('Customer name is required');
    if (!text.trim()) return setFormError('Testimonial text is required');
    if (rating < 1 || rating > 5) return setFormError('Rating must be between 1 and 5');

    const payload = {
      customer_name: customerName.trim(),
      location: location.trim() || null,
      text: text.trim(),
      rating,
      is_active: isActive
    };

    if (editingTestimonial) {
      updateMutation.mutate({ ...payload, id: editingTestimonial.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (t: Testimonial) => {
    showConfirm({
      title: 'Delete Testimonial',
      description: `Are you sure you want to delete the testimonial from ${t.customer_name}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(t.id);
        closeModal();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="h-10 w-32 bg-zinc-200 rounded-xl" />
        </div>
        <div className="h-16 bg-zinc-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <Check className="h-4 w-4" />
          <span className="text-sm font-semibold">Testimonial saved!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-zinc-900 flex items-center gap-2">
            Testimonials Manager
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage customer feedback shown on the storefront homepage testimonials carousel.
          </p>
        </div>
        <Button 
          onClick={handleOpenAddForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 shadow-sm active:scale-98 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Testimonial
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex gap-3 text-zinc-700">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <span className="font-bold">Storefront Integration:</span> Active testimonials will automatically rotate in the carousel on the public home page. Testimonials toggled as hidden will remain in the database but will not be shown to customers.
        </div>
      </div>

      {/* Grid of Testimonials */}
      {testimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div 
              key={t.id} 
              className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative ${
                t.is_active ? 'border-zinc-100' : 'border-dashed border-zinc-200 opacity-70 bg-zinc-50/50'
              }`}
            >
              {/* Active/Hidden Badge */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  t.is_active 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}>
                  {t.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {t.is_active ? 'Visible' : 'Hidden'}
                </span>
              </div>

              {/* Main Content */}
              <div>
                {/* Rating Display */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < t.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-200'
                      }`} 
                    />
                  ))}
                </div>

                {/* Text quote */}
                <p className="text-zinc-700 text-sm italic leading-relaxed mb-6 font-sans">
                  "{t.text}"
                </p>
              </div>

              {/* Author & Footer */}
              <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">{t.customer_name}</h4>
                  {t.location && (
                    <p className="text-zinc-400 text-xs flex items-center gap-0.5 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {t.location}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMutation.mutate(t)}
                    className="p-1.5 text-zinc-500 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors"
                    title={t.is_active ? 'Hide testimonial' : 'Show testimonial'}
                  >
                    {t.is_active ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                  <button
                    onClick={() => handleOpenEditForm(t)}
                    className="p-1.5 text-zinc-500 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors"
                    title="Edit testimonial"
                  >
                    <Edit2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-1.5 text-zinc-500 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                    title="Delete testimonial"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
          <MessageSquare className="h-12 w-12 text-zinc-200 mb-3" />
          <p className="text-sm font-semibold text-zinc-500">No testimonials created yet</p>
          <p className="text-xs text-zinc-400 mt-1">Create testimonials to display on the storefront home page.</p>
        </div>
      )}

      {/* Form Drawer / Slide-Over Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div 
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left p-6 md:p-8"
          >
            {/* Header */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold font-headline text-zinc-900">
                  {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
                </h3>
                <button 
                  onClick={handleCloseForm}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saran Neralla"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, TS"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Clickable Star Rating Selector */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Rating (1-5 Stars)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      const isHighlighted = hoverRating !== null 
                        ? starValue <= hoverRating 
                        : starValue <= rating;
                      
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 hover:scale-110 active:scale-95 transition-transform"
                          title={`${starValue} Stars`}
                        >
                          <Star 
                            className={`h-7 w-7 transition-colors ${
                              isHighlighted 
                                ? 'fill-amber-500 text-amber-500' 
                                : 'text-zinc-200'
                            }`} 
                          />
                        </button>
                      );
                    })}
                    <span className="text-sm font-semibold text-zinc-500 ml-2">
                      {rating} Star{rating > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Testimonial / Review Text
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write customer feedback here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800">
                      Show on Webstore
                    </label>
                    <p className="text-[11px] text-zinc-400">If active, this review will display on home page.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    {isActive ? (
                      <span className="text-primary font-bold text-xs border border-primary/20 bg-primary/5 px-2.5 py-1 rounded-full uppercase">Active</span>
                    ) : (
                      <span className="text-zinc-400 font-bold text-xs border border-zinc-200 bg-zinc-50 px-2.5 py-1 rounded-full uppercase">Hidden</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-zinc-100 pt-6 flex gap-3">
              <Button
                type="button"
                onClick={handleCloseForm}
                variant="outline"
                className="flex-1 py-2.5 border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 shadow-sm active:scale-98 transition-all"
              >
                {editingTestimonial ? 'Save Changes' : 'Create Testimonial'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
