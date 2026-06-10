import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, Globe, X, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/store/cartStore';
import { CartSidebar } from '@/components/CartSidebar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { i18n } = useTranslation();
  const totalItems = useCartStore((s) => s.totalItems);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isInstallable, installApp } = usePWAInstall();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'te' : 'en');
  };

  const navLinks = [
    { to: '/', label: 'Home', labelTE: 'హోమ్' },
    { to: '/products', label: 'Our Pickles', labelTE: 'మా పచ్చళ్లు' },
    { to: '/about', label: 'Heritage', labelTE: 'చరిత్ర' },
  ];

  const isTE = i18n.language === 'te';

  return (
    <>
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          {/* Left: Mobile menu + Logo */}
          <div className="flex gap-3 items-center">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-primary" />}
            </Button>
            <Link to="/" className="flex items-center gap-2 md:gap-3 group">
              <img
                src="/logo.png"
                alt="Neralla Inti Ruchulu Logo"
                className="h-10 w-10 object-contain rounded-full transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-headline font-bold text-lg md:text-xl text-primary tracking-tight leading-none">
                {isTE ? 'నేరెళ్ల ఇంటి రుచులు' : 'Neralla Inti Ruchulu'}
              </span>
            </Link>
          </div>

          {/* Center: Desktop nav */}
          <nav className="hidden md:flex gap-6 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                {isTE ? link.labelTE : link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Language toggle + Cart */}
          <div className="flex items-center gap-2 md:gap-3">
            {isInstallable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={installApp}
                className="hidden sm:flex text-secondary hover:bg-secondary/10 text-xs font-semibold border border-secondary/20 rounded-full px-3"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {isTE ? 'యాప్ ఇన్‌స్టాల్' : 'Install App'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="hidden sm:flex text-primary hover:bg-primary/10 text-xs font-semibold border border-primary/20 rounded-full px-3"
            >
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              {isTE ? 'EN' : 'తె'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCartOpen(true)}
              className="relative border-primary/20 text-primary hover:bg-primary/10 transition-colors rounded-full"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white shadow-sm">
                  {totalItems()}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-6 py-3 text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                )}
              >
                {isTE ? link.labelTE : link.label}
              </Link>
            ))}
            <div className="px-6 py-3 border-t border-border/30">
              <button onClick={toggleLanguage} className="flex items-center gap-2 text-sm text-primary font-medium">
                <Globe className="h-4 w-4" />
                {isTE ? 'Switch to English' : 'తెలుగులోకి మారు'}
              </button>
            </div>
            {isInstallable && (
              <div className="px-6 py-3 border-t border-border/30">
                <button onClick={installApp} className="flex items-center gap-2 text-sm text-secondary font-medium">
                  <Download className="h-4 w-4" />
                  {isTE ? 'యాప్ ఇన్‌స్టాల్ చేయి' : 'Install App'}
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
