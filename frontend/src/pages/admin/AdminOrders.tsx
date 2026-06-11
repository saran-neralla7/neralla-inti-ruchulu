import { useState } from 'react';
import {
  CheckCircle2, Clock,
  Trash2, Edit2, X, ChevronDown, MessageSquare,
  PackageCheck, AlertCircle, Eye, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/store/modalStore';
import { generateOrderPDF } from '@/utils/generateOrderPDF';
import { generateOrdersReportPDF } from '@/utils/generateOrdersReportPDF';
import type { Order } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  'Pending Approval': 'bg-amber-100 text-amber-700',
  Confirmed:         'bg-blue-100 text-blue-700',
  Preparing:         'bg-purple-100 text-purple-700',
  'Out For Delivery':'bg-orange-100 text-orange-700',
  Delivered:         'bg-green-100 text-green-700',
  Cancelled:         'bg-red-100 text-red-700',
};

const ACTIVE_STATUSES = ['Confirmed', 'Preparing', 'Out For Delivery', 'Delivered', 'Cancelled'];

// ─── Edit Order Drawer ────────────────────────────────────────────────────────
function EditOrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [customerAddress, setCustomerAddress] = useState(order.customerAddress || '');
  const [adminNotes, setAdminNotes] = useState((order as any).adminNotes || '');
  const [items, setItems] = useState((order.items || []).map((i: any) => ({ ...i })));

  // Finance fields for approved/delivered orders
  const [actualShippingCost, setActualShippingCost] = useState((order.actualShippingCost ?? 0).toString());
  const [actualAmountPaid, setActualAmountPaid] = useState(
    order.actualAmountPaid !== null && order.actualAmountPaid !== undefined
      ? order.actualAmountPaid.toString()
      : ''
  );
  const [paymentStatus, setPaymentStatus] = useState<string>(order.paymentStatus || 'Unpaid');

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/orders/${order.id}`, {
        customerName,
        customerPhone,
        customerAddress,
        adminNotes,
        items,
        actualShippingCost: Number(actualShippingCost) || 0,
        actualAmountPaid: actualAmountPaid !== '' ? Number(actualAmountPaid) : null,
        paymentStatus,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-background w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-foreground">Edit Order Inquiry</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customer details */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Details</p>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
        </div>

        {/* Items */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Items</p>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/30 rounded-lg">
              <div className="col-span-5 text-xs font-medium text-foreground truncate">{item.productName_en}</div>
              <div className="col-span-2 text-xs text-muted-foreground">{item.variantSize}</div>
              <div className="col-span-2">
                <input
                  type="number" min={1}
                  value={item.quantity}
                  onChange={e => setItems(prev => prev.map((it: any, i: number) => i === idx ? { ...it, quantity: Number(e.target.value) } : it))}
                  className="w-full border border-border rounded px-1 py-0.5 text-xs bg-background text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number" min={0}
                  value={item.price}
                  onChange={e => setItems(prev => prev.map((it: any, i: number) => i === idx ? { ...it, price: Number(e.target.value) } : it))}
                  className="w-full border border-border rounded px-1 py-0.5 text-xs bg-background text-center"
                />
              </div>
              <button onClick={() => setItems(prev => prev.filter((_: any, i: number) => i !== idx))} className="col-span-1 text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Admin Notes */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Admin Notes</p>
          <textarea
            rows={2}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
            placeholder="e.g. Customer confirmed payment via GPay"
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
          />
        </div>

        {order.orderNumber && (
          <div className="space-y-3 border-t border-border/30 pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Finance & Shipping</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Actual Courier Cost</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                  <input
                    type="number"
                    value={actualShippingCost}
                    onChange={e => setActualShippingCost(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 border border-border rounded-lg text-xs bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Actual Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={actualAmountPaid}
                    onChange={e => setActualAmountPaid(e.target.value)}
                    placeholder="Auto (items total)"
                    className="w-full pl-6 pr-2 py-1.5 border border-border rounded-lg text-xs bg-background font-bold text-primary"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
                className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background"
              >
                <option value="Unpaid">Unpaid (చెల్లించలేదు)</option>
                <option value="Paid">Paid (చెల్లించారు)</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button
            onClick={() => editMutation.mutate()}
            disabled={editMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl"
          >
            {editMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Popup ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-primary">
            {order.orderNumber ? `Order ${order.orderNumber}` : 'Pending Inquiry'}
          </h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-semibold">{order.customerName}</p></div>
          <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-semibold">{order.customerPhone}</p></div>
          <div><p className="text-xs text-muted-foreground">Fulfillment Status</p>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground')}>{order.status}</span>
          </div>
          <div><p className="text-xs text-muted-foreground">Placed</p><p className="font-semibold">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
          {order.orderNumber && (
            <>
              <div><p className="text-xs text-muted-foreground">Payment Status</p>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                  {order.paymentStatus || 'Unpaid'}
                </span>
              </div>
              <div><p className="text-xs text-muted-foreground">Actual Paid Amount</p>
                <p className="font-semibold text-primary">
                  {order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? `₹${order.actualAmountPaid}` : '-'}
                </p>
              </div>
              <div><p className="text-xs text-muted-foreground">Actual Courier Cost</p>
                <p className="font-semibold text-zinc-700">
                  {order.actualShippingCost !== undefined ? `₹${order.actualShippingCost}` : '₹0'}
                </p>
              </div>
            </>
          )}
        </div>
        {(order as any).adminNotes && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold text-xs mb-1">Admin Notes</p>
            {(order as any).adminNotes}
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-border/30 last:border-0">
              <div>
                <p className="font-medium">{item.productName_en}</p>
                <p className="text-xs text-muted-foreground">{item.variantSize} · {item.variantPackaging} × {item.quantity}</p>
              </div>
              <p className="font-semibold text-primary">₹{(item.price * item.quantity).toFixed(0)}</p>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 font-bold text-base">
            <span>Total</span>
            <span className="text-primary">₹{total.toFixed(0)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => generateOrderPDF(order)} 
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center gap-1.5"
          >
            <FileText className="h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">Close</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminOrders() {
  const queryClient = useQueryClient();
  const { showConfirm } = useModalStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterPreset, setDateFilterPreset] = useState('all'); // 'all', 'today', 'yesterday', 'this-week', 'this-month', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');

  // Custom status update modal states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [statusModalNextStatus, setStatusModalNextStatus] = useState<string>('');
  const [shippingCostInput, setShippingCostInput] = useState<string>('');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [markAsPaidInput, setMarkAsPaidInput] = useState<boolean>(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    },
  });

  const { data: productsList = [] } = useQuery<any[]>({
    queryKey: ['admin-products-list'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/orders/${id}/approve`, {});
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, actualShippingCost, actualAmountPaid, paymentStatus }: { id: string; status?: string; actualShippingCost?: number; actualAmountPaid?: number | null; paymentStatus?: string }) => {
      const res = await api.put(`/orders/${id}/status`, { status, actualShippingCost, actualAmountPaid, paymentStatus });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const togglePaymentStatus = (order: Order) => {
    const nextPaymentStatus = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    updateStatusMutation.mutate({
      id: order.id,
      paymentStatus: nextPaymentStatus,
      actualAmountPaid: nextPaymentStatus === 'Paid'
        ? (order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : total(order))
        : null,
    });
  };

  const handleStatusChange = (order: Order, nextStatus: string) => {
    if (nextStatus === 'Out For Delivery' || nextStatus === 'Delivered') {
      const collected = total(order) < 999 ? 80 : 0;
      setStatusModalOrder(order);
      setStatusModalNextStatus(nextStatus);
      setShippingCostInput((order.actualShippingCost ?? collected).toString());
      setAmountPaidInput((order.actualAmountPaid ?? total(order)).toString());
      setMarkAsPaidInput(order.paymentStatus === 'Paid' || nextStatus === 'Delivered');
      setStatusModalOpen(true);
    } else {
      updateStatusMutation.mutate({ id: order.id, status: nextStatus });
    }
  };

  const handleSaveStatusModal = () => {
    if (!statusModalOrder) return;
    const cost = parseFloat(shippingCostInput) || 0;
    const amountPaid = statusModalNextStatus === 'Delivered'
      ? (markAsPaidInput ? (parseFloat(amountPaidInput) || 0) : null)
      : undefined;
    const payStatus = markAsPaidInput ? 'Paid' : 'Unpaid';

    updateStatusMutation.mutate({
      id: statusModalOrder.id,
      status: statusModalNextStatus,
      actualShippingCost: cost,
      actualAmountPaid: amountPaid,
      paymentStatus: payStatus,
    });

    setStatusModalOpen(false);
    setStatusModalOrder(null);
  };

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/orders/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const pendingOrders = orders.filter(o => o.status === 'Pending Approval');
  const activeOrders = orders.filter(o => o.status !== 'Pending Approval');

  const filteredActive = activeOrders.filter(order => {
    // 1. Status Filter Tab
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    
    // 2. Search Query (name, phone, order number)
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const nameMatch = order.customerName.toLowerCase().includes(query);
      const phoneMatch = order.customerPhone.includes(query);
      const numberMatch = order.orderNumber ? order.orderNumber.toLowerCase().includes(query) : false;
      if (!nameMatch && !phoneMatch && !numberMatch) return false;
    }
    
    // 3. Product filter
    if (selectedProduct !== 'all') {
      const hasProduct = order.items.some(item => 
        item.productName_en.toLowerCase() === selectedProduct.toLowerCase() || 
        item.productName_te === selectedProduct
      );
      if (!hasProduct) return false;
    }
    
    // 4. Date filter
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilterPreset === 'today') {
      const startOfToday = new Date(today);
      if (orderDate < startOfToday) return false;
    } else if (dateFilterPreset === 'yesterday') {
      const startOfYesterday = new Date(today);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(today);
      if (orderDate < startOfYesterday || orderDate >= endOfYesterday) return false;
    } else if (dateFilterPreset === 'this-week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - today.getDay());
      if (orderDate < startOfWeek) return false;
    } else if (dateFilterPreset === 'this-month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      if (orderDate < startOfMonth) return false;
    } else if (dateFilterPreset === 'custom') {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }
    }
    
    return true;
  });

  const handleApprove = (order: Order) => {
    showConfirm({
      title: 'Approve & Assign Order Number',
      description: `Confirm that payment has been received from ${order.customerName}. This will assign order number NIR-${new Date().getFullYear()}-... and move it to Confirmed.`,
      confirmText: '✓ Approve & Confirm',
      cancelText: 'Cancel',
      isDestructive: false,
      onConfirm: async () => { await approveMutation.mutateAsync(order.id); },
    });
  };

  const handleDelete = (order: Order) => {
    showConfirm({
      title: order.status === 'Pending Approval' ? 'Discard Inquiry' : 'Delete Order',
      description: order.status === 'Pending Approval'
        ? `Discard the inquiry from ${order.customerName}? This means the customer withdrew or the order didn't go through.`
        : `Delete order ${order.orderNumber} from ${order.customerName}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => { await deleteOrderMutation.mutateAsync(order.id); },
    });
  };

  const total = (order: Order) => order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{orders.length} total · {pendingOrders.length} pending approval</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'pending' ? 'bg-white shadow-sm text-amber-700' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <AlertCircle className="h-4 w-4" />
          Pending Approval
          {pendingOrders.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {pendingOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'active' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <PackageCheck className="h-4 w-4" />
          Active Orders
          <span className="bg-muted text-muted-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {activeOrders.length}
          </span>
        </button>
      </div>

      {/* ── Pending Approval Tab ── */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
          {!isLoading && pendingOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
              <CheckCircle2 className="h-14 w-14 opacity-20" />
              <p className="font-medium">No pending inquiries</p>
              <p className="text-sm">All WhatsApp orders have been reviewed.</p>
            </div>
          )}
          {pendingOrders.map(order => (
            <div key={order.id} className="bg-card border border-amber-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Pending Approval
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-headline font-bold text-foreground text-base">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">₹{total(order).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Items preview */}
              <div className="mt-3 space-y-1">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.productName_en} · {item.variantSize} × {item.quantity}</span>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{order.items.length - 3} more item(s)</p>
                )}
              </div>

              {(order as any).adminNotes && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                  <MessageSquare className="inline h-3 w-3 mr-1" />
                  {(order as any).adminNotes}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Button
                  onClick={() => handleApprove(order)}
                  disabled={approveMutation.isPending}
                  className="bg-secondary hover:bg-secondary/90 text-white rounded-xl h-9 px-4 text-sm font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve & Assign Order No.
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateOrderPDF(order)}
                  className="rounded-xl h-9 px-3 text-sm border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" /> Invoice PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingOrder(order)}
                  className="rounded-xl h-9 px-3 text-sm border-border text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewingOrder(order)}
                  className="rounded-xl h-9 px-3 text-sm border-border text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(order)}
                  className="rounded-xl h-9 px-3 text-sm text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Active Orders Tab ── */}
      {activeTab === 'active' && (
        <div>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', ...ACTIVE_STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  filterStatus === s
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Search & Filters Bar */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 mb-6 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search customer name, phone, order no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>

              {/* Product Selector */}
              <div className="w-full md:w-48">
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Products</option>
                  {productsList.map((p: any) => (
                    <option key={p.id} value={p.name_en}>
                      {p.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Preset Selector */}
              <div className="w-full md:w-48">
                <select
                  value={dateFilterPreset}
                  onChange={e => setDateFilterPreset(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* PDF Print Button */}
              <Button
                onClick={() => generateOrdersReportPDF(filteredActive, {
                  searchQuery,
                  datePreset: dateFilterPreset,
                  startDate,
                  endDate,
                  selectedProduct
                })}
                disabled={filteredActive.length === 0}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 h-10 shrink-0"
              >
                <FileText className="h-4 w-4" /> Print PDF Report
              </Button>
            </div>

            {/* Custom Date Inputs */}
            {dateFilterPreset === 'custom' && (
              <div className="flex gap-3 items-center border-t border-border/40 pt-3 animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="border border-border rounded-xl px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="border border-border rounded-xl px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}
          </div>

          {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
          {!isLoading && filteredActive.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
              <PackageCheck className="h-14 w-14 opacity-20" />
              <p className="font-medium">No orders found</p>
            </div>
          )}

          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            {filteredActive.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredActive.map(order => {
                    return (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-primary">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <select
                              value={order.status}
                              onChange={e => handleStatusChange(order, e.target.value)}
                              className={cn(
                                'text-xs font-semibold px-2 py-1 pr-6 rounded-full appearance-none cursor-pointer border-0 outline-none',
                                STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground'
                              )}
                            >
                              {ACTIVE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <button
                              onClick={() => togglePaymentStatus(order)}
                              disabled={updateStatusMutation.isPending}
                              className={cn(
                                'text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-150 active:scale-95 flex items-center gap-1',
                                order.paymentStatus === 'Paid'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              )}
                              title="Click to toggle payment status"
                            >
                              <span className={cn('h-1.5 w-1.5 rounded-full', order.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-red-500')} />
                              {order.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                            </button>
                            {order.paymentStatus === 'Paid' && (
                              <span className="text-xs text-muted-foreground font-medium pl-1">
                                {order.actualAmountPaid !== null && order.actualAmountPaid !== undefined
                                  ? `₹${order.actualAmountPaid}`
                                  : `₹${total(order).toFixed(0)}`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">₹{total(order).toFixed(0)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => generateOrderPDF(order)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors" title="Download Invoice PDF">
                              <FileText className="h-4 w-4" />
                            </button>
                            <button onClick={() => setViewingOrder(order)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors" title="View Order">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingOrder(order)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors" title="Edit Order">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(order)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" title="Delete Order">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {editingOrder && <EditOrderDrawer order={editingOrder} onClose={() => setEditingOrder(null)} />}
      {viewingOrder && <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />}
      
      {statusModalOpen && statusModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 transform transition-all duration-300 scale-100">
            <h3 className="font-headline text-lg font-bold text-primary flex items-center gap-2 border-b border-border pb-3">
              Order {statusModalOrder.orderNumber} Details
            </h3>
            
            <div className="space-y-4">
              {/* Courier Shipping Cost Input */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  Actual Courier Shipping Cost paid (Outflow)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                  <input
                    type="number"
                    value={shippingCostInput}
                    onChange={(e) => setShippingCostInput(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Enter the exact courier delivery fee paid.
                </p>
              </div>

              {/* Customer Paid Amount Input (Only show when marking as Delivered) */}
              {statusModalNextStatus === 'Delivered' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">
                      Actual Amount Paid by Customer (Inflow)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-sm font-bold">₹</span>
                      <input
                        type="number"
                        value={amountPaidInput}
                        onChange={(e) => setAmountPaidInput(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-primary"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Enter the exact amount collected from the customer.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="markAsPaidCheckbox"
                      checked={markAsPaidInput}
                      onChange={(e) => {
                        setMarkAsPaidInput(e.target.checked);
                        if (e.target.checked && !amountPaidInput) {
                          setAmountPaidInput(total(statusModalOrder).toString());
                        }
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background cursor-pointer"
                    />
                    <label htmlFor="markAsPaidCheckbox" className="text-sm font-semibold text-foreground select-none cursor-pointer">
                      Payment Received (Mark as Paid)
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusModalOrder(null);
                }}
                className="rounded-xl border-border/80"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveStatusModal}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold"
              >
                Save & Update Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
