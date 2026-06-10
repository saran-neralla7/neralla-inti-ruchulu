import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductSpiceLevel(name: string) {
  const n = name.toLowerCase();
  if (n.includes('avakaya') || n.includes('mango') || n.includes('chicken') || n.includes('gongura')) {
    return {
      labelEn: 'ANDHRA FIRE (HIGH)',
      labelTe: 'ఆంధ్రా ఫైర్ (కారం ఎక్కువ)',
      key: 'fire',
      color: 'text-red-700 bg-red-50 border-red-200',
      rating: 5,
      reviews: 128
    };
  } else if (n.includes('tomato') || n.includes('kandi') || n.includes('podi') || n.includes('dal')) {
    return {
      labelEn: 'MEDIUM SPICY',
      labelTe: 'మధ్యమ కారం',
      key: 'medium',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      rating: 4.8,
      reviews: 84
    };
  } else {
    return {
      labelEn: 'MILD / SWEET',
      labelTe: 'కారం తక్కువ / తీపి',
      key: 'mild',
      color: 'text-green-700 bg-green-50 border-green-200',
      rating: 4.9,
      reviews: 42
    };
  }
}

