import { useState } from 'react';
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useModalStore } from '@/store/modalStore';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { showAlert } = useModalStore();
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isTE = i18n.language === 'te';

  const handleWhatsAppCheckout = async () => {
    if (!customerName || !customerPhone) return;
    setLoading(true);

    const itemLines = items
      .map((item, i) => {
        const name = isTE ? item.name_te : item.name_en;
        return `${i + 1}. ${name} (${item.size} · ${item.packaging}) × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(0)}`;
      })
      .join('\n');

    const message = [
      `🌶️ *Order - Neralla Inti Ruchulu*`,
      ``,
      `👤 *Name:* ${customerName}`,
      `📞 *Phone:* ${customerPhone}`,
      ``,
      `*Items:*`,
      itemLines,
      ``,
      `💰 *Total: ₹${totalPrice().toFixed(0)}*`,
    ].join('\n');

    try {
      // 1. Create order in PostgreSQL database
      await api.post('/orders', {
        customerName,
        customerPhone,
        customerAddress: 'WhatsApp Checkout',
        whatsappMessage: message,
        items: items.map((item) => ({
          name_en: item.name_en,
          name_te: item.name_te,
          size: item.size,
          packaging: item.packaging,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // 2. Redirect to WhatsApp
      const encodedMsg = encodeURIComponent(message);
      window.open(`https://wa.me/918247843466?text=${encodedMsg}`, '_blank');

      // 3. Clear cart, close sidebar, and navigate to success page
      useCartStore.getState().clearCart();
      setCustomerName('');
      setCustomerPhone('');
      onClose();
      navigate('/order-success');
    } catch (error) {
      console.error('Order creation failed:', error);
      showAlert({
        title: isTE ? 'ఆర్డర్ లోపం' : 'Order Error',
        description: isTE 
          ? 'ఆర్డర్ సేవ్ చేయడంలో విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.' 
          : 'Failed to process order. Please try again.',
        confirmText: isTE ? 'సరే' : 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn('fixed inset-0 bg-black/40 z-40 transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={cn(
        'fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border z-50 flex flex-col shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <h2 className="font-headline text-xl font-semibold text-primary flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({totalItems()})
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                {item.image && (
                  <img src={item.image} alt={item.name_en} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{isTE ? item.name_te : item.name_en}</p>
                  <p className="text-xs text-muted-foreground">{item.size} · {item.packaging}</p>
                  <p className="text-sm font-semibold text-primary mt-1">₹{(item.price * item.quantity).toFixed(0)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5 border border-border/60 rounded-full px-1">
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="p-1 hover:text-primary">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="p-1 hover:text-primary">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border/60 px-5 py-4 space-y-4">
            <div className="flex justify-between items-center text-base font-semibold">
              <span>Total</span>
              <span className="text-primary text-xl">₹{totalPrice().toFixed(0)}</span>
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Your details for the order:</p>
              <input
                type="text"
                placeholder="Your Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 text-base font-semibold gap-2 shadow-lg shadow-green-600/20"
              onClick={handleWhatsAppCheckout}
              disabled={!customerName || !customerPhone || loading}
            >
              {loading ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Order via WhatsApp
                </>
              )}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
