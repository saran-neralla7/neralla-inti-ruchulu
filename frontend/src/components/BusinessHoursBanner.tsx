import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Clock, X } from 'lucide-react';

interface Settings {
  business_open_time?: string | null;
  business_close_time?: string | null;
  business_days?: string | null;
}

export function BusinessHoursBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings-public'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  // Check if dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('nir_hours_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!settings || isDismissed) {
      setIsVisible(false);
      return;
    }

    const { business_open_time, business_close_time, business_days } = settings;

    // If any of the variables are not set, don't show the banner
    if (!business_open_time || !business_close_time || !business_days) {
      setIsVisible(false);
      return;
    }

    // Helper to get current Indian Standard Time (IST)
    const getISTTime = () => {
      const d = new Date();
      // UTC time
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      // Add 5 hours and 30 minutes for IST
      return new Date(utc + 3600000 * 5.5);
    };

    const istDate = getISTTime();
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = daysArr[istDate.getDay()];
    
    // Check if current day is a working day
    const workingDays = business_days.split(',').map(d => d.trim());
    const isWorkingDay = workingDays.includes(currentDay);

    if (!isWorkingDay) {
      setIsVisible(true);
      return;
    }

    // Check time
    const [openH, openM] = business_open_time.split(':').map(Number);
    const [closeH, closeM] = business_close_time.split(':').map(Number);

    const currentH = istDate.getHours();
    const currentM = istDate.getMinutes();

    const currentVal = currentH * 60 + currentM;
    const openVal = openH * 60 + openM;
    const closeVal = closeH * 60 + closeM;

    if (currentVal < openVal || currentVal > closeVal) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [settings, isDismissed]);

  const handleDismiss = () => {
    sessionStorage.setItem('nir_hours_banner_dismissed', 'true');
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Formatting hours nicely for display
  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minStr = m.toString().padStart(2, '0');
    return `${hour12}:${minStr} ${ampm}`;
  };

  const openTimeFormatted = settings?.business_open_time ? formatTime(settings.business_open_time) : '9:00 AM';
  const closeTimeFormatted = settings?.business_close_time ? formatTime(settings.business_close_time) : '8:00 PM';
  
  // Format days nicely (e.g. Mon,Tue,Wed,Thu,Fri,Sat -> Mon-Sat)
  const displayDays = settings?.business_days 
    ? settings.business_days.replace(/,/g, ', ') 
    : 'Mon–Sat';

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2.5 px-4 shadow-md transition-all duration-300 relative z-40 text-center flex items-center justify-center gap-2 text-xs md:text-sm font-medium">
      <div className="flex items-center justify-center gap-2 flex-1">
        <Clock className="h-4 w-4 animate-pulse shrink-0" />
        <span>
          We are currently closed or outside working hours. You can still browse and add items, but order approvals will resume during our business hours ({displayDays}, {openTimeFormatted} – {closeTimeFormatted} IST).
        </span>
      </div>
      <button 
        onClick={handleDismiss} 
        className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition-all focus:outline-none shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
