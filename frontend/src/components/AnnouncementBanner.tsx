import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Megaphone } from 'lucide-react';

interface Settings {
  banner_enabled?: boolean;
  banner_text?: string;
  banner_color?: string;
}

const COLOR_MAP: Record<string, string> = {
  amber: 'from-amber-500 to-amber-700',
  red: 'from-red-500 to-red-700',
  green: 'from-green-500 to-green-700',
  blue: 'from-blue-500 to-blue-700',
  indigo: 'from-indigo-500 to-indigo-700',
  purple: 'from-purple-500 to-purple-700',
};

export function AnnouncementBanner() {
  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings-public'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  if (!settings || !settings.banner_enabled || !settings.banner_text) {
    return null;
  }

  const gradientColor = COLOR_MAP[settings.banner_color || 'amber'] || COLOR_MAP.amber;

  return (
    <div className={`bg-gradient-to-r ${gradientColor} text-white py-2 px-4 shadow-sm relative z-40 text-center flex items-center justify-center gap-2 text-xs md:text-sm font-medium border-b border-white/10 overflow-hidden`}>
      <div className="flex items-center justify-center gap-2 max-w-full">
        <Megaphone className="h-3.5 w-3.5 shrink-0 animate-bounce" />
        <span className="truncate max-w-4xl tracking-wide font-medium">
          {settings.banner_text}
        </span>
      </div>
    </div>
  );
}
