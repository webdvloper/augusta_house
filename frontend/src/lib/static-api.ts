import { asset } from "./config";
import type {
  Category,
  Collection,
  Order,
  OrderPayload,
  Paginated,
  Product,
  ProductDetail,
} from "./types";

/** Реализация API поверх снимка каталога — для статичной демо-версии без бэкенда. */

type SnapshotProduct = Omit<ProductDetail, "related"> & {
  collections: string[];
  newest_rank: number;
};

interface Snapshot {
  categories: Category[];
  products: SnapshotProduct[];
  collections: Omit<Collection, "product_count" | "preview">[];
}

export interface StaticProductQuery {
  category?: string;
  collection?: string;
  search?: string;
  skus?: string;
  in_stock?: boolean;
  sale?: boolean;
  is_new?: boolean;
  min_price?: string;
  max_price?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

const ORDER_KEY = "ah:demo-order";
const DELIVERY_LABELS = {
  pickup: "Самовывоз (Химки)",
  courier: "Курьер по Москве и области",
  post: "Почта России",
  cdek: "СДЭК",
} as const;

let cached: Promise<Snapshot> | null = null;

function withAssets(categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    image: category.image && asset(category.image),
    children: withAssets(category.children),
  }));
}

function load(): Promise<Snapshot> {
  cached ??= import("./demo-catalog.json").then((module) => {
    const raw = module.default as Snapshot;
    return {
      ...raw,
      categories: withAssets(raw.categories),
      products: raw.products.map((product) => ({
        ...product,
        image: product.image && asset(product.image),
        photos: product.photos.map((photo) => ({ ...photo, image: asset(photo.image) })),
      })),
    };
  });
  return cached;
}

function toCard(product: SnapshotProduct): Product {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    old_price: product.old_price,
    discount_percent: product.discount_percent,
    stock: product.stock,
    unit: product.unit,
    in_stock: product.in_stock,
    is_new: product.is_new,
    category: product.category,
    image: product.image,
  };
}

const SORTERS: Record<string, (a: SnapshotProduct, b: SnapshotProduct) => number> = {
  price: (a, b) => Number(a.price) - Number(b.price),
  "-price": (a, b) => Number(b.price) - Number(a.price),
  "-views_count": (a, b) => b.views_count - a.views_count,
  "-created_at": (a, b) => a.newest_rank - b.newest_rank,
};

function select(snapshot: Snapshot, query: StaticProductQuery): SnapshotProduct[] {
  const words = (query.search ?? "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  const skus = query.skus?.split(",").map((sku) => sku.trim());
  const min = query.min_price ? Number(query.min_price) : -Infinity;
  const max = query.max_price ? Number(query.max_price) : Infinity;

  return snapshot.products
    .filter((product) => {
      const price = Number(product.price);
      const text = `${product.name} ${product.sku} ${product.description}`.toLowerCase();
      return (
        (!query.category || product.breadcrumbs.some((crumb) => crumb.slug === query.category)) &&
        (!query.collection || product.collections.includes(query.collection)) &&
        (!skus || skus.includes(product.sku)) &&
        (!query.in_stock || product.in_stock) &&
        (!query.sale || product.discount_percent > 0) &&
        (!query.is_new || product.is_new) &&
        price >= min &&
        price <= max &&
        words.every((word) => text.includes(word))
      );
    })
    .sort(SORTERS[query.ordering ?? ""] ?? SORTERS["-created_at"]);
}

function toCollection(snapshot: Snapshot, slug: string, preview: number): Collection | null {
  const base = snapshot.collections.find((collection) => collection.slug === slug);
  if (!base) return null;
  const products = select(snapshot, { collection: slug });
  return {
    ...base,
    product_count: products.length,
    preview: products.slice(0, preview).map(toCard),
  };
}

class NotFoundError extends Error {
  name = "ApiError";
  status = 404;
}

export const staticApi = {
  async categories(): Promise<Category[]> {
    return (await load()).categories;
  },

  async products(query: StaticProductQuery = {}): Promise<Paginated<Product>> {
    const items = select(await load(), query);
    const size = Math.min(query.page_size ?? 12, 60);
    const start = ((query.page ?? 1) - 1) * size;
    return {
      count: items.length,
      next: null,
      previous: null,
      results: items.slice(start, start + size).map(toCard),
    };
  },

  async product(sku: string): Promise<ProductDetail> {
    const snapshot = await load();
    const product = snapshot.products.find((item) => item.sku === sku);
    if (!product) throw new NotFoundError("Товар не найден.");
    const related = snapshot.products
      .filter((item) => item.category.id === product.category.id && item.sku !== sku)
      .slice(0, 4)
      .map(toCard);
    return { ...product, related };
  },

  async collections(preview = 4): Promise<Collection[]> {
    const snapshot = await load();
    return snapshot.collections.map(({ slug }) => toCollection(snapshot, slug, preview)!);
  },

  async collection(slug: string): Promise<Collection> {
    const collection = toCollection(await load(), slug, 0);
    if (!collection) throw new NotFoundError("Подборка не найдена.");
    return collection;
  },

  /** Демо-заказ никуда не отправляется: он живёт в sessionStorage до закрытия вкладки. */
  async createOrder(payload: OrderPayload): Promise<Order> {
    const snapshot = await load();
    const items = payload.items.map(({ sku, quantity }) => {
      const product = snapshot.products.find((item) => item.sku === sku);
      if (!product) throw new Error(`Товар ${sku} больше не продаётся.`);
      if (product.stock < quantity) {
        throw new Error(`«${product.name}»: в наличии только ${product.stock} ${product.unit}.`);
      }
      const subtotal = (Number(product.price) * quantity).toFixed(2);
      return { sku, name: product.name, price: product.price, quantity, subtotal };
    });
    const order: Order = {
      ...payload,
      public_id: "demo",
      number: "AH-ДЕМО",
      status: "new",
      status_label: "Демо-заказ (не отправлен)",
      delivery_label: DELIVERY_LABELS[payload.delivery_method],
      total: items.reduce((sum, item) => sum + Number(item.subtotal), 0).toFixed(2),
      created_at: new Date().toISOString(),
      items,
    };
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
    return order;
  },

  async order(): Promise<Order> {
    const raw = typeof window === "undefined" ? null : window.sessionStorage.getItem(ORDER_KEY);
    if (!raw) throw new NotFoundError("Заказ не найден.");
    return JSON.parse(raw) as Order;
  },
};
