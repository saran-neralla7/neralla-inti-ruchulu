import { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  User, Lock, Smartphone, Info, Download, CheckCircle2,
  Shield, Globe, Store, Clock, Save, Check, AlertCircle, Link as LinkIcon,
  Megaphone, Database, Upload, RefreshCw, Trash2, UserPlus
} from 'lucide-react';
import { useModalStore } from '@/store/modalStore';

interface SettingsData {
  id: string;
  business_name: string;
  whatsapp_number: string;
  free_shipping_limit: number;
  shipping_charge: number;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  business_open_time: string | null;
  business_close_time: string | null;
  business_days: string | null;
  banner_enabled: boolean;
  banner_text: string;
  banner_color: string;
}

export function AdminSettings() {
  const queryClient = useQueryClient();
  const { user } = useAdminStore();
  const { isInstallable, installApp } = usePWAInstall();
  const { showConfirm, showAlert } = useModalStore();
  
  const [installed, setInstalled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [restoring, setRestoring] = useState(false);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Fetch settings from API
  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['settings-admin'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  // Fetch admins (Super Admin Only)
  const { data: adminUsers = [], isLoading: isLoadingAdmins, refetch: refetchAdmins } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
    enabled: user?.role === 'Super Admin',
  });

  // Manage Admins State
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Super Admin' | 'Admin'>('Admin');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const createAdminMutation = useMutation({
    mutationFn: async (newData: any) => {
      return await api.post('/admin/users', newData);
    },
    onSuccess: () => {
      refetchAdmins();
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminRole('Admin');
      setAdminSuccess('Admin user created successfully!');
      setTimeout(() => setAdminSuccess(''), 3000);
    },
    onError: (err: any) => {
      setAdminError(err.response?.data?.error || 'Failed to create admin user');
      setTimeout(() => setAdminError(''), 4000);
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      return await api.delete(`/admin/users/${adminId}`);
    },
    onSuccess: () => {
      refetchAdmins();
      setAdminSuccess('Admin user deleted successfully!');
      setTimeout(() => setAdminSuccess(''), 3000);
    },
    onError: (err: any) => {
      setAdminError(err.response?.data?.error || 'Failed to delete admin user');
      setTimeout(() => setAdminError(''), 4000);
    }
  });

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [freeShippingLimit, setFreeShippingLimit] = useState('1000');
  const [shippingCharge, setShippingCharge] = useState('50');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');

  // Business Hours Form State
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  // Storefront Banner State
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [bannerColor, setBannerColor] = useState('amber');

  // Sync state with fetched settings
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name || '');
      setWhatsappNumber(settings.whatsapp_number || '');
      setFreeShippingLimit((settings.free_shipping_limit ?? 1000).toString());
      setShippingCharge((settings.shipping_charge ?? 50).toString());
      setAddress(settings.address || '');
      setInstagram(settings.instagram_url || '');
      setFacebook(settings.facebook_url || '');
      setYoutube(settings.youtube_url || '');
      setOpenTime(settings.business_open_time || '09:00');
      setCloseTime(settings.business_close_time || '20:00');
      setBannerEnabled(settings.banner_enabled || false);
      setBannerText(settings.banner_text || '');
      setBannerColor(settings.banner_color || 'amber');
      
      if (settings.business_days) {
        setWorkingDays(settings.business_days.split(',').map(d => d.trim()));
      } else {
        setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
      }
    }
  }, [settings]);

  const handleInstall = async () => {
    await installApp();
    setInstalled(true);
  };

  // Days list for checkboxes
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleDayToggle = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedData: Partial<SettingsData>) => {
      return await api.put('/settings', updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['settings-public'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message || 'Failed to save settings');
      setTimeout(() => setSaveError(''), 4000);
    }
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');

    if (!businessName.trim()) return setSaveError('Business name is required');
    if (!whatsappNumber.trim()) return setSaveError('WhatsApp number is required');

    const limit = parseFloat(freeShippingLimit);
    const charge = parseFloat(shippingCharge);

    if (isNaN(limit) || limit < 0) return setSaveError('Free shipping limit must be positive');
    if (isNaN(charge) || charge < 0) return setSaveError('Shipping charge must be positive');

    saveMutation.mutate({
      business_name: businessName.trim(),
      whatsapp_number: whatsappNumber.trim(),
      free_shipping_limit: limit,
      shipping_charge: charge,
      address: address.trim() || null,
      instagram_url: instagram.trim() || null,
      facebook_url: facebook.trim() || null,
      youtube_url: youtube.trim() || null,
      business_open_time: openTime,
      business_close_time: closeTime,
      business_days: workingDays.join(','),
      banner_enabled: bannerEnabled,
      banner_text: bannerText.trim(),
      banner_color: bannerColor,
    });
  };

  // 1-Click Backup Database
  const handleBackup = async () => {
    try {
      const res = await api.get('/admin/backup');
      const dataStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `neralla_inti_ruchulu_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      showAlert({
        title: 'Backup Failed',
        description: error.response?.data?.error || error.message || 'Failed to download database backup.',
      });
    }
  };

  // 1-Click Restore Database
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showConfirm({
      title: '⚠️ Restore Database?',
      description: 'WARNING: Restoring the database will OVERWRITE all current settings, categories, products, orders, expenses, and reviews. This action cannot be undone. Are you absolutely sure?',
      confirmText: 'Yes, Overwrite & Restore',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        setRestoring(true);
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error('Failed to read backup file');
              const json = JSON.parse(text);
              const res = await api.post('/admin/restore', json);
              if (res.data.success) {
                queryClient.invalidateQueries();
                showAlert({
                  title: 'Database Restored',
                  description: 'Database backup restored successfully. The page will reload.',
                });
                setTimeout(() => window.location.reload(), 2000);
              }
            } catch (err: any) {
              console.error(err);
              showAlert({
                title: 'Restore Failed',
                description: err.response?.data?.error || err.message || 'Invalid backup JSON file or API restore error.',
              });
            } finally {
              setRestoring(false);
            }
          };
          reader.readAsText(file);
        } catch (error: any) {
          console.error(error);
          showAlert({
            title: 'Restore Failed',
            description: error.message || 'Failed to process the backup file.',
          });
          setRestoring(false);
        }
      }
    });
    // Reset file input
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-80 bg-zinc-100 rounded-2xl" />
        <div className="h-80 bg-zinc-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 relative">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <Check className="h-4 w-4" />
          <span className="text-sm font-semibold">Settings saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your shop metadata, announcement banner, backup database, and PWA setup.</p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 shadow-sm active:scale-98 transition-all"
        >
          <Save className="h-4.5 w-4.5" />
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* 1. Storefront & Shipping */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">Storefront & Shipping</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">WhatsApp Contact Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 8247843466"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Default Shipping Charge (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={shippingCharge}
                onChange={(e) => setShippingCharge(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={freeShippingLimit}
                onChange={(e) => setFreeShippingLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Business Address</label>
              <textarea
                rows={3}
                placeholder="Shop address shown on invoices..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Storefront Announcement Banner (Option 4) */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-6 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">Storefront Announcement Banner</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <div>
                <label className="text-sm font-semibold text-zinc-900 block">Enable Announcement Banner</label>
                <span className="text-xs text-zinc-500 block">Show a top alert banner ticker to customers visiting the website.</span>
              </div>
              <input
                type="checkbox"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                className="h-5.5 w-10 border-zinc-300 rounded-full text-primary focus:ring-primary bg-zinc-200 cursor-pointer accent-primary"
              />
            </div>

            {bannerEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-1 duration-200">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Banner Text Content</label>
                  <input
                    type="text"
                    required={bannerEnabled}
                    placeholder="e.g. Free shipping on orders above ₹999! fresh batch sun-drying now."
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Banner Background Color</label>
                  <select
                    value={bannerColor}
                    onChange={(e) => setBannerColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  >
                    <option value="amber">Gold / Amber (శిఖరం)</option>
                    <option value="red">Red / Hot (ఆంధ్రా హార్ట్)</option>
                    <option value="green">Green / Fresh (తాజా)</option>
                    <option value="blue">Blue / Standard (నీలం)</option>
                    <option value="indigo">Indigo / Special (ఇండిగో)</option>
                    <option value="purple">Purple / Royal (రాయల్)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Business Hours Settings */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">Business Hours & Operational Days</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Shop Opening Time</label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Shop Closing Time</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>

            <div className="space-y-2.5 md:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Working Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekDays.map(day => {
                  const isChecked = workingDays.includes(day);
                  return (
                    <button 
                      type="button"
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      className={`flex items-center justify-center p-2.5 border rounded-xl cursor-pointer text-xs font-semibold select-none transition-all active:scale-95 ${
                        isChecked 
                          ? 'border-primary bg-primary/5 text-primary font-bold' 
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Note: Outside these days/hours, a closed banner will display to public customers browsing the store.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Social Media Links */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4">
            <LinkIcon className="h-5 w-5 text-primary" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">Social Media Connections</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Instagram Page URL</label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Facebook Page URL</label>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">YouTube Channel URL</label>
              <input
                type="url"
                placeholder="https://youtube.com/..."
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* 5. Database Backup & Restore (Option A) */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-5 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">Database Backup & Offline Restore</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl flex items-start gap-3.5">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900">Zero Data Loss Management</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Export a snapshot of all settings, categories, products, orders, expenses, and review testimonials to a local JSON file. 
                  In case of accidental deletion, you can upload this backup file to completely restore your store data.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                type="button"
                onClick={handleBackup}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl px-5 h-11 font-semibold flex items-center justify-center gap-2 flex-1 shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download JSON Backup
              </Button>

              <div className="relative flex-1">
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleRestore}
                  disabled={restoring}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={restoring}
                  className="w-full border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl px-5 h-11 font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  {restoring ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-zinc-400" />
                  )}
                  {restoring ? 'Restoring Database...' : 'Restore JSON Backup'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Account Settings */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">Admin Account Info</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5" /> Logged In As
              </label>
              <p className="text-sm font-semibold text-zinc-900 bg-zinc-50 rounded-xl px-3.5 py-2.5 border border-zinc-100">
                {user?.username}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 font-medium">
                <Lock className="h-3.5 w-3.5" /> Access Role
              </label>
              <p className="text-sm font-semibold text-zinc-900 bg-zinc-50 rounded-xl px-3.5 py-2.5 border border-zinc-100">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Manage Admin Accounts (Super Admin Only) */}
        {user?.role === 'Super Admin' && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-50 pb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-headline font-semibold text-base text-zinc-950">Manage Admin Accounts</h2>
            </div>

            {/* Error and Success alerts */}
            {adminError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}
            {adminSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3 flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            {/* Add New Admin Form */}
            <div className="bg-zinc-50/50 rounded-xl border border-zinc-100 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-primary" /> Add New Admin User
              </h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
                    setAdminError('Username and password are required');
                    return;
                  }
                  createAdminMutation.mutate({
                    username: newAdminUsername.trim(),
                    password: newAdminPassword.trim(),
                    role: newAdminRole,
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-semibold">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. manager"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-semibold">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-semibold">Access Role</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={createAdminMutation.isPending}
                  className="bg-primary hover:bg-primary/95 text-white rounded-lg px-4 h-9.5 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm w-full"
                >
                  <UserPlus className="h-4 w-4" />
                  {createAdminMutation.isPending ? 'Adding...' : 'Add User'}
                </Button>
              </form>
            </div>

            {/* List of existing admin users */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-semibold">Existing Admin Users</label>
              {isLoadingAdmins ? (
                <div className="h-20 bg-zinc-50 animate-pulse rounded-xl" />
              ) : (
                <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-100 text-sm">
                      <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">Username</th>
                          <th className="px-4 py-3 text-left">Role</th>
                          <th className="px-4 py-3 text-left">Created At</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-zinc-100 text-zinc-700 font-medium">
                        {adminUsers.map((admin: any) => (
                          <tr key={admin.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-zinc-900">{admin.username}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                admin.role === 'Super Admin' 
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                  : 'bg-zinc-50 text-zinc-700 border border-zinc-100'
                              }`}>
                                {admin.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">
                              {new Date(admin.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {admin.id === user?.id ? (
                                <span className="text-xs text-muted-foreground italic mr-2">You</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    showConfirm({
                                      title: 'Remove Admin User?',
                                      description: `Are you sure you want to delete the admin user "${admin.username}"? They will lose all access immediately.`,
                                      confirmText: 'Yes, Delete',
                                      cancelText: 'Cancel',
                                      isDestructive: true,
                                      onConfirm: () => {
                                        deleteAdminMutation.mutate(admin.id);
                                      }
                                    });
                                  }}
                                  disabled={deleteAdminMutation.isPending}
                                  className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. PWA Install */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4 mb-4">
            <Smartphone className="h-5 w-5 text-secondary" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">Install as App (PWA)</h2>
          </div>

          {isStandalone || installed ? (
            <div className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">App is already installed!</p>
                <p className="text-xs text-emerald-600 mt-1">
                  You are currently running Neralla Inti Ruchulu as an installed app on this device.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    Install this admin dashboard as a native-like app on your device
                  </p>
                  <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside mt-1">
                    <li>Works offline with cached data</li>
                    <li>Launches from home screen like a native app</li>
                    <li>No browser address bar — full screen experience</li>
                  </ul>
                </div>
              </div>

              {isInstallable ? (
                <Button
                  onClick={handleInstall}
                  className="bg-secondary hover:bg-secondary/90 text-white rounded-xl px-6 h-11 font-semibold flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Install App Now
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Installation not available</p>
                    <p className="text-xs text-amber-700">
                      Your browser hasn't triggered the install prompt yet. This usually happens because:
                    </p>
                    <ul className="text-xs text-amber-700 list-disc list-inside mt-2 space-y-1">
                      <li>You're running in development mode (use the built/deployed version)</li>
                      <li>The app is already installed on this device</li>
                      <li>You're using Safari — use <strong>Share → Add to Home Screen</strong> instead</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5 mb-1 font-medium">
                        <Globe className="h-3.5 w-3.5 text-primary" /> Chrome / Edge (Desktop)
                      </p>
                      <p className="text-xs text-zinc-500">
                        Click the ⊕ icon in the browser address bar, then click "Install".
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5 mb-1 font-medium">
                        <Smartphone className="h-3.5 w-3.5 text-secondary" /> iOS Safari
                      </p>
                      <p className="text-xs text-zinc-500">
                        Tap the Share icon (□↑), scroll down and tap "Add to Home Screen".
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 8. App Diagnostics */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-4 mb-4">
            <Info className="h-5 w-5 text-zinc-400" />
            <h2 className="font-headline font-semibold text-base text-zinc-950">App Diagnostics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1 font-medium">App Name</p>
              <p className="font-semibold text-zinc-900">Neralla Inti Ruchulu</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1 font-medium">Version</p>
              <p className="font-semibold text-zinc-900">1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1 font-medium">Type</p>
              <p className="font-semibold text-zinc-900">Progressive Web App</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1 font-medium">Mode</p>
              <p className="font-semibold text-zinc-900">
                {isStandalone ? '📱 Standalone (Installed)' : '🌐 Browser'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
