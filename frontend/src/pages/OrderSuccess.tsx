import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, MessageSquare, ArrowRight, ShoppingBag, Stars } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OrderSuccess() {
  const { t, i18n } = useTranslation();
  const isTE = i18n.language === 'te';

  return (
    <div className={cn("min-h-[80vh] flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5 text-foreground relative overflow-hidden", isTE && "leading-loose")}>
      
      {/* Decorative Ornaments */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-20 left-10 opacity-5 pointer-events-none hidden lg:block">
        <Stars className="h-40 w-40 text-primary" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-5 pointer-events-none hidden lg:block">
        <ShoppingBag className="h-40 w-40 text-primary" />
      </div>

      {/* Main card */}
      <div className="w-full max-w-lg bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-500 relative z-10">
        
        {/* Top border decoration */}
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
        
        <div className="p-8 md:p-12 text-center flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8 hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.png"
              alt="Neralla Inti Ruchulu Logo"
              className="w-24 h-24 object-contain rounded-full shadow-md border border-border/60"
            />
          </div>

          {/* Checked Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center border-4 border-green-500/30">
              <CheckCircle2 className="h-12 w-12 text-green-600 fill-green-50" />
            </div>
            <div className="absolute -inset-4 bg-green-500/10 rounded-full blur-xl -z-10 animate-pulse" />
          </div>

          {/* Heading */}
          <h1 className="font-headline font-bold text-2xl md:text-3xl text-primary mb-2">
            {t('success.title')}
          </h1>
          <p className="text-muted-foreground italic text-sm md:text-base mb-6">
            {t('success.subtitle')}
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full max-w-[150px] mb-6">
            <div className="h-px flex-grow bg-border" />
            <Stars className="h-4 w-4 text-secondary" />
            <div className="h-px flex-grow bg-border" />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-8">
            {t('success.desc')}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full">
            <Button
              className="w-full h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 group"
              onClick={() => window.open('https://wa.me/918247843466', '_blank')}
            >
              <MessageSquare className="h-4.5 w-4.5 fill-current" />
              {t('success.whatsapp')}
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 border-primary text-primary hover:bg-primary/5 rounded-xl font-bold active:scale-95"
              asChild
            >
              <Link to="/products">
                {t('success.continue')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Card Footer: Traditional Motif */}
        <div className="bg-muted/30 px-8 py-3.5 flex justify-center items-center border-t border-border/40 opacity-70">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
            {isTE ? 'సాంప్రదాయ రుచులు' : 'Authentic Traditions'}
          </span>
        </div>
      </div>
    </div>
  );
}
