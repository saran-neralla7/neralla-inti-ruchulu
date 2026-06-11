// Types matching the Prisma schema
export interface Variant {
  id: string;
  productId: string;
  size: string;
  packaging: string;
  variantPrice: number;
  packagingCharge: number;
  costPrice?: number;
}

export interface Category {
  id: string;
  name_en: string;
  name_te: string;
  order: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name_en: string;
  name_te: string;
  description_en?: string;
  description_te?: string;
  ingredients?: string;
  storage?: string;
  shelfLife?: string;
  status: 'Available' | 'Out Of Stock' | 'Coming Soon' | 'Seasonal';
  label?: string;
  spice: 'fire' | 'medium' | 'mild';
  gallery: string[];
  inventory: number;
  rating?: number;
  reviewCount?: number;
  category?: Category;
  variants: Variant[];
  createdAt?: string;
}

export interface Order {
  id: string;
  orderNumber?: string | null;  // null until admin approves
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  whatsappMessage?: string;
  status: string;
  adminNotes?: string | null;
  items: OrderItem[];
  createdAt: string;
  approvedAt?: string | null;
  actualShippingCost?: number;
  actualAmountPaid?: number | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productName_en: string;
  productName_te: string;
  variantSize: string;
  variantPackaging: string;
  quantity: number;
  price: number;
}
