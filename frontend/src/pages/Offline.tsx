import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Phone, WifiOff, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Offline() {
  const { t, i18n } = useTranslation();
  const isTE = i18n.language === 'te';
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setRetrying(false);
        // Show offline feedback toast/alert
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-6 py-3 rounded-full shadow-lg text-sm font-semibold z-[100] transition-all animate-bounce';
        toast.innerText = isTE ? 'ఇంకా ఆఫ్‌లైన్‌లోనే ఉన్నారు. దయచేసి నెట్‌వర్క్ తనిఖీ చేయండి.' : 'Still offline. Please check your internet connection.';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    }, 1200);
  };

  useEffect(() => {
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        window.location.reload();
      }
    };
    window.addEventListener('online', handleOnlineStatus);
    return () => window.removeEventListener('online', handleOnlineStatus);
  }, []);

  return (
    <div className={cn("min-h-[80vh] flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5 text-foreground relative overflow-hidden", isTE && "leading-loose")}>
      
      {/* Decorative Ornaments */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-20 right-10 opacity-5 pointer-events-none hidden lg:block">
        <WifiOff className="h-40 w-40 text-primary" />
      </div>

      <div className="max-w-xl w-full text-center relative z-10 flex flex-col items-center">
        
        {/* Heritage border wrapper for logo */}
        <div className="mb-10 p-4 border border-primary/20 bg-background rounded-2xl shadow-md relative group">
          <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-2 border-l-2 border-secondary" />
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-2 border-r-2 border-secondary" />
          
          <img
            src="/logo.png"
            alt="Neralla Inti Ruchulu Logo"
            className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-full"
          />
        </div>

        {/* Text stack */}
        <div className="space-y-4 max-w-md">
          <h1 className="text-primary font-headline font-bold text-3xl md:text-5xl leading-tight">
            {t('offline.title')}
          </h1>
          <p className="text-secondary font-headline text-lg font-semibold uppercase tracking-wider">
            నేరెళ్ల ఇంటి రుచులు
          </p>
          
          <div className="w-16 h-px bg-primary/20 mx-auto my-4" />
          
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            {t('offline.desc')}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              className="w-full sm:w-auto px-10 h-13 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
              onClick={handleRetry}
              disabled={retrying}
            >
              <RefreshCw className={cn("h-4.5 w-4.5", retrying && "animate-spin")} />
              {retrying ? (isTE ? 'కనెక్ట్ చేస్తోంది...' : 'RETRYING...') : t('offline.retry')}
            </Button>
            
            <Button
              variant="outline"
              className="w-full sm:w-auto px-10 h-13 border-primary text-primary hover:bg-primary/5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              asChild
            >
              <a href="tel:+918247843466">
                <Phone className="h-4.5 w-4.5" />
                {t('offline.call')}
              </a>
            </Button>
          </div>
        </div>

        {/* Bottom floral motif */}
        <div className="mt-16 opacity-30 w-full max-w-xs h-1 border-b-2 border-dashed border-primary/40 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3">
            <Globe className="h-5 w-5 text-primary" />
          </div>
        </div>

      </div>
    </div>
  );
}
