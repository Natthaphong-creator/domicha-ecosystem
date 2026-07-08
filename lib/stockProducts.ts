import { shopProducts, type ShopProduct } from "@/lib/shopCatalog";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_STOCK_API_URL = "https://script.google.com/macros/s/AKfycbwSkVdHTMdN4jN3sfG8bHXV0KldDjj4oOhwiix9iDIgh5pV0vlE-N_Hb23wkst63N1nFw/exec";
const FALLBACK_IMAGE = "/products/taiwan-tea.png";

type StockCategory = {
  label?: string;
  name?: string;
  items?: string[];
};

type StockSnapshot = {
  cats?: StockCategory[];
  item_prices?: Record<string, number | string>;
  item_images?: Record<string, string>;
  wh_stock?: Record<string, number | string>;
  min_stock?: Record<string, number | string>;
  wh_min?: Record<string, number | string>;
};

type PullResponse = {
  ok?: boolean;
  data?: StockSnapshot;
  meta?: { updatedAt?: string; version?: string };
  error?: string;
};

type ProductOverride = {
  product_name: string;
  selling_price: number | string | null;
  image_url: string | null;
};

export type StockProductsResult = {
  products: ShopProduct[];
  source: "stock" | "fallback";
  updatedAt: string | null;
  error?: string;
};

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ก-๙._-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeImage(value: unknown) {
  if (typeof value !== "string") return FALLBACK_IMAGE;
  const trimmed = value.trim();
  if (!trimmed) return FALLBACK_IMAGE;
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return FALLBACK_IMAGE;
}

function comparableName(value: string) {
  return value
    .toLowerCase()
    .replace(/domicha|โดมิชา/gi, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function findProductOverride(name: string, overrides: ProductOverride[]) {
  const normalizedName = comparableName(name);
  if (!normalizedName) return undefined;

  return overrides.find((product) => comparableName(product.product_name) === normalizedName)
    || overrides.find((product) => {
      const productName = comparableName(product.product_name);
      return productName.includes(normalizedName) || normalizedName.includes(productName);
    });
}

function unitFromName(name: string) {
  if (/ไซรัป|syrup|ขวด/i.test(name)) return "ขวด";
  if (/แก้ว|ฝา|หลอด|ถุงหิ้ว|แพ็ก|pack/i.test(name)) return "แพ็ก";
  return "ถุง";
}

export function transformStockSnapshot(snapshot: StockSnapshot, overrides: ProductOverride[] = []): ShopProduct[] {
  const seen = new Set<string>();
  const products: ShopProduct[] = [];
  const prices = snapshot.item_prices || {};
  const images = snapshot.item_images || {};
  const warehouseStock = snapshot.wh_stock || {};

  for (const category of snapshot.cats || []) {
    const categoryName = category.label || category.name || "สินค้า";
    for (const itemName of category.items || []) {
      const name = String(itemName || "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const override = findProductOverride(name, overrides);
      const price = numberValue(prices[name], numberValue(override?.selling_price));
      const hasStockValue = Object.prototype.hasOwnProperty.call(warehouseStock, name);
      const stock = hasStockValue ? numberValue(warehouseStock[name]) : undefined;
      products.push({
        id: `stock-${slugify(name)}`,
        name,
        description: stock === undefined
          ? "สินค้า DomiCha Stock • รอ HQ ยืนยันราคา/สต็อก"
          : `สินค้า DomiCha Stock • คลังกลาง ${stock.toLocaleString("th-TH")} ${unitFromName(name)}`,
        category: categoryName,
        price,
        unit: unitFromName(name),
        image: normalizeImage(images[name] || override?.image_url),
        badge: stock === 0 ? "หมด" : price <= 0 ? "รอราคา" : undefined,
        stock,
        source: "stock"
      });
    }
  }

  for (const itemName of Object.keys(warehouseStock).sort()) {
    const name = itemName.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const override = findProductOverride(name, overrides);
    const price = numberValue(prices[name], numberValue(override?.selling_price));
    const stock = numberValue(warehouseStock[name]);
    products.push({
      id: `stock-${slugify(name)}`,
      name,
      description: `สินค้า DomiCha Stock • คลังกลาง ${stock.toLocaleString("th-TH")} ${unitFromName(name)}`,
      category: "สินค้า",
      price,
      unit: unitFromName(name),
      image: normalizeImage(images[name] || override?.image_url),
      badge: stock <= 0 ? "หมด" : undefined,
      stock,
      source: "stock"
    });
  }

  return products;
}

async function fetchProductOverrides(): Promise<ProductOverride[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("product_name,selling_price,image_url")
    .eq("status", "Active");

  if (error || !data) return [];
  return data as ProductOverride[];
}

export async function fetchStockProducts(): Promise<StockProductsResult> {
  const apiUrl = process.env.DOMICHA_STOCK_API_URL || DEFAULT_STOCK_API_URL;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "pull" }),
      next: { revalidate: 60 }
    });

    if (!response.ok) throw new Error(`DomiCha Stock API ${response.status}`);

    const payload = (await response.json()) as PullResponse;
    if (!payload.ok) throw new Error(payload.error || "DomiCha Stock API returned an error");

    const overrides = await fetchProductOverrides();
    const products = transformStockSnapshot(payload.data || {}, overrides);
    if (!products.length) throw new Error("ยังไม่มีรายการสินค้าจาก DomiCha Stock");

    return {
      products,
      source: "stock",
      updatedAt: payload.meta?.updatedAt || null
    };
  } catch (error) {
    return {
      products: shopProducts,
      source: "fallback",
      updatedAt: null,
      error: error instanceof Error ? error.message : "ดึงสินค้า DomiCha Stock ไม่สำเร็จ"
    };
  }
}
