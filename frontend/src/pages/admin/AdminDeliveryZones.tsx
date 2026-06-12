import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useModalStore } from '@/store/modalStore';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  AlertCircle,
  X,
  Check
} from 'lucide-react';

interface DeliveryZone {
  id: string;
  name: string;
  pincode: string;
  delivery_charge: number;
  is_active: boolean;
}

export function AdminDeliveryZones() {
  const queryClient = useQueryClient();
  const { showConfirm, close: closeModal } = useModalStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('');
  const [charge, setCharge] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch Delivery Zones
  const { data: zones = [], isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const res = await api.get('/delivery-zones');
      return res.data;
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newZone: Omit<DeliveryZone, 'id'>) => {
      return await api.post('/delivery-zones', newZone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      handleCloseForm();
      showSuccessFeedback();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create delivery zone');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (updated: DeliveryZone) => {
      return await api.put(`/delivery-zones/${updated.id}`, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      handleCloseForm();
      showSuccessFeedback();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to update delivery zone');
    }
  });

  // Toggle Active Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async (zone: DeliveryZone) => {
      return await api.put(`/delivery-zones/${zone.id}`, {
        ...zone,
        is_active: !zone.is_active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/delivery-zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    }
  });

  const showSuccessFeedback = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleOpenAddForm = () => {
    setEditingZone(null);
    setName('');
    setPincode('');
    setCharge('0');
    setIsActive(true);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setName(zone.name);
    setPincode(zone.pincode);
    setCharge(zone.delivery_charge.toString());
    setIsActive(zone.is_active);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingZone(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) return setFormError('Zone name is required');
    if (!pincode.trim()) return setFormError('Pincode is required');
    
    // validate pincode format (6 digits for India)
    if (!/^\d{6}$/.test(pincode.trim())) {
      return setFormError('Pincode must be exactly 6 digits');
    }

    const delivery_charge = parseFloat(charge);
    if (isNaN(delivery_charge) || delivery_charge < 0) {
      return setFormError('Delivery charge must be a valid positive number');
    }

    const payload = {
      name: name.trim(),
      pincode: pincode.trim(),
      delivery_charge,
      is_active: isActive
    };

    if (editingZone) {
      updateMutation.mutate({ ...payload, id: editingZone.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (zone: DeliveryZone) => {
    showConfirm({
      title: 'Delete Delivery Zone',
      description: `Are you sure you want to delete the delivery zone for ${zone.name} (${zone.pincode})?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(zone.id);
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
        <div className="h-80 bg-zinc-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <Check className="h-4 w-4" />
          <span className="text-sm font-semibold">Changes saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-zinc-900 flex items-center gap-2">
            Delivery Zone Manager
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Define regions where your business ships and assign specific delivery charges.
          </p>
        </div>
        <Button 
          onClick={handleOpenAddForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 shadow-sm active:scale-98 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Delivery Zone
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex gap-3 text-zinc-700">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <span className="font-bold">How Pincode Matching Works:</span> During checkout, if the customer's pincode matches one of the active zones below, the corresponding delivery fee is applied automatically. If it doesn't match any zone, the general settings delivery charge is applied.
        </div>
      </div>

      {/* Zones List Container */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
        {zones.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Zone Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Pincode</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-right">Delivery Charge</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-zinc-400" />
                          {zone.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-zinc-600">
                        {zone.pincode}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold">
                        {zone.delivery_charge === 0 ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          <span className="text-zinc-950">₹{zone.delivery_charge}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleMutation.mutate(zone)}
                          className={`inline-flex items-center gap-1 p-1 rounded-full hover:bg-zinc-100 active:scale-95 transition-all text-sm`}
                          title={zone.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {zone.is_active ? (
                            <ToggleRight className="h-8 w-8 text-primary" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-zinc-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditForm(zone)}
                            className="p-2 text-zinc-500 hover:text-primary hover:bg-zinc-50 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(zone)}
                            className="p-2 text-zinc-500 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-zinc-100">
              {zones.map((zone) => (
                <div key={zone.id} className="p-4 space-y-3 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-zinc-955 text-sm flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-zinc-400" />
                        {zone.name}
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{zone.pincode}</p>
                    </div>
                    <span className="text-xs font-bold">
                      {zone.delivery_charge === 0 ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Free</span>
                      ) : (
                        <span className="text-zinc-950 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100 font-mono">₹{zone.delivery_charge}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-100/50">
                    <button
                      onClick={() => toggleMutation.mutate(zone)}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-semibold"
                      title={zone.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {zone.is_active ? (
                        <>
                          <ToggleRight className="h-6 w-6 text-primary" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-6 w-6 text-zinc-300" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEditForm(zone)}
                        className="p-1.5 text-zinc-500 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors border border-border/30"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(zone)}
                        className="p-1.5 text-zinc-500 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors border border-border/30"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <MapPin className="h-12 w-12 text-zinc-200 mb-3" />
            <p className="text-sm font-semibold text-zinc-500">No delivery zones defined yet</p>
            <p className="text-xs text-zinc-400 mt-1">Create one to enable custom pincode delivery charges.</p>
          </div>
        )}
      </div>

      {/* Form Drawer / Slide-Over Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div 
            className="w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left p-6"
          >
            {/* Header */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold font-headline text-zinc-900">
                  {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
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
                    Zone Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tenali Local"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 522201"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Delivery Charge (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="0 for free shipping"
                      value={charge}
                      onChange={(e) => setCharge(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-primary"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Set to 0 to make shipping free for this pincode.</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800">
                      Active
                    </label>
                    <p className="text-[11px] text-zinc-400">Make this pincode active during order checkout.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="p-1 rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    {isActive ? (
                      <ToggleRight className="h-8 w-8 text-primary" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-zinc-300" />
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
                {editingZone ? 'Save Changes' : 'Create Zone'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
