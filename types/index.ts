export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  images: ProductImage[];
  category: Category;
  shop: Shop;
  variants?: ProductVariant[];
  isActive: boolean;
  createdAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
  stock: number;
  sku?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  children?: Category[];
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  rating: number;
  totalSales: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variantId?: string;
  variant?: ProductVariant;
}

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  district: string;
  subDistrict: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: string;
  trackingNumber?: string;
  carrier?: string;
  items: OrderItem[];
  address: Address;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  variantId?: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  images?: string[];
  user: { name: string; avatar?: string };
  createdAt: Date;
}

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "best_selling" | "rating";
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

