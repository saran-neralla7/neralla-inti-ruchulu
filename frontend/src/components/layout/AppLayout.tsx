import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AnnouncementBanner } from '../AnnouncementBanner';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <AnnouncementBanner />
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
