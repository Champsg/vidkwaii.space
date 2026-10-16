export type Currency = 'INR' | 'USD';

export interface BundleOption {
  id: string;
  name: string;
  packCount: number;
  priceInr: number;
  originalPriceInr: number;
  priceUsd: number;
  originalPriceUsd: number;
  savingsLabel: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  includedColors: string[];
  perks: string[];
  imageUrl?: string;
}

export interface Review {
  id: string;
  author: string;
  avatarInitials: string;
  rating: number;
  date: string;
  skinType: string;
  title: string;
  content: string;
  verified: boolean;
  helpfulCount: number;
  purchasedPack: string;
  imageUrl?: string;
  videoUrl?: string;
  postUrl?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'safety' | 'usage' | 'orders';
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  /** Prepaid online payment only — no cash on delivery. */
  paymentMethod: 'upi' | 'card' | 'online';
  couponCode?: string;
  notes?: string;
}

export interface OrderRecord {
  orderId: string;
  createdAt: string;
  bundle: BundleOption;
  quantity: number;
  currency: Currency;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  customer: CustomerDetails;
  trackingNumber: string;
  estimatedDeliveryDate: string;
  status: 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  /** 'paid' once the gateway confirms the online payment; 'pending' until then. */
  paymentStatus?: 'paid' | 'pending';
}
