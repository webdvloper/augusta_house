import { IS_STATIC } from "./config";
import { staticApi } from "./static-api";
import type {
  Category,
  Collection,
  Order,
  OrderPayload,
  Paginated,
  Product,
  ProductDetail,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const suffix = params.size ? `?${params}` : "";
  return `${API_URL}/api${path}${suffix}`;
}

/** Запрос к Django API. Ошибки приходят в формате { detail: string }. */
async function request<T>(path: string, query?: Query, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Сервер магазина недоступен. Попробуйте позже.", 0);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(body?.detail ?? `Ошибка ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export interface ProductQuery extends Query {
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

const httpApi = {
  categories: () => request<Category[]>("/categories/"),
  products: (query?: ProductQuery) => request<Paginated<Product>>("/products/", query),
  product: (sku: string) => request<ProductDetail>(`/products/${encodeURIComponent(sku)}/`),
  collections: (preview = 4) => request<Collection[]>("/collections/", { preview }),
  collection: (slug: string) =>
    request<Collection>(`/collections/${encodeURIComponent(slug)}/`, { preview: 0 }),
  order: (id: string) => request<Order>(`/orders/${encodeURIComponent(id)}/`),
  createOrder: (payload: OrderPayload) =>
    request<Order>("/orders/", undefined, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

/** В статичной демо-версии те же методы работают поверх снимка каталога. */
export const api: typeof httpApi = IS_STATIC ? staticApi : httpApi;
