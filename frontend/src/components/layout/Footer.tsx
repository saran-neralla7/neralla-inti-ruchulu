import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-zinc-50 dark:bg-zinc-950 mt-auto">
      <div className="container flex flex-col md:flex-row items-center justify-between py-8 gap-4">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground font-medium">
            &copy; {new Date().getFullYear()} Neralla Inti Ruchulu. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Premium Andhra Home Foods from Tenali.
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
}
