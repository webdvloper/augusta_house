export interface CategoryBrief {
  id: number;
  name: string;
  slug: string;
}

export interface Category extends CategoryBrief {
  parent: number | null;
  image: string | null;
  product_count: number;
  children: Category[];
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: string;
  old_price: string | null;
  discount_percent: number;
  stock: number;
  unit: string;
  in_stock: boolean;
  is_new: boolean;
  category: CategoryBrief;
  image: string | null;
}

export interface ProductPhoto {
  id: number;
  image: string;
  sort_order: number;
  is_main: boolean;
}

export interface ProductDetail extends Product {
  description: string;
  views_count: number;
  photos: ProductPhoto[];
  breadcrumbs: { name: string; slug: string }[];
  related: Product[];
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  product_count: number;
  preview: Product[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type DeliveryMethod = "pickup" | "courier" | "post" | "cdek";

export interface OrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: DeliveryMethod;
  address: string;
  comment: string;
  items: { sku: string; quantity: number }[];
}

export interface Order {
  public_id: string;
  number: string;
  status: string;
  status_label: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: DeliveryMethod;
  delivery_label: string;
  address: string;
  comment: string;
  total: string;
  created_at: string;
  items: { sku: string; name: string; price: string; quantity: number; subtotal: string }[];
}
