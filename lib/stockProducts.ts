import { shopProducts, type ShopProduct } from "@/lib/shopCatalog";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_STOCK_API_URL = "https://script.google.com/macros/s/AKfycbwSkVdHTMdN4jN3sfG8bHXV0KldDjj4oOhwiix9iDIgh5pV0vlE-N_Hb23wkst63N1nFw/exec";

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

function stockFallbackImage(name: string, category = "สินค้า") {
  if (/ชาไต้หวัน/i.test(name)) return "/products/taiwan-tea.png";
  if (/ชาแดง/i.test(name)) return "/products/red-tea.png";
  if (/ชาเขียว/i.test(name)) return "/products/green-tea.png";
  if (/ชามะลิ/i.test(name)) return "/products/jasmine-tea.png";
  if (/สตรอ|straw/i.test(name)) return "/products/strawberry-syrup.png";
  if (/กล้วย/i.test(name)) return "/products/banana-powder.png";

  const isPack = /แก้ว|ฝา|หลอด|ถุง|ม้วน|กระดาษ|แพ็ก|pack/i.test(name + category);
  const isTopping = /บุก|ไข่มุก|ฟรุ๊ต|ท็อป/i.test(name + category);
  const isDrink = /น้ำ|โซดา|Pepsi|โค้ก|M150/i.test(name);
  const palette = isPack
    ? { bg: "#fff7ed", accent: "#f97316", icon: "🥤", label: "Packaging" }
    : isTopping
      ? { bg: "#fef3c7", accent: "#92400e", icon: "🧋", label: "Topping" }
      : isDrink
        ? { bg: "#eff6ff", accent: "#2563eb", icon: "🥤", label: "Drink" }
        : { bg: "#fff7ed", accent: "#c2410c", icon: "📦", label: "Ingredient" };

  const safeName = name.slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="${palette.bg}"/>
        <stop offset="1" stop-color="#ffffff"/>
      </linearGradient>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#7c2d12" flood-opacity=".14"/>
      </filter>
    </defs>
    <rect width="720" height="720" rx="56" fill="url(#g)"/>
    <circle cx="360" cy="268" r="132" fill="#fff" filter="url(#s)"/>
    <text x="360" y="310" text-anchor="middle" font-size="104">${palette.icon}</text>
    <rect x="150" y="454" width="420" height="64" rx="32" fill="${palette.accent}" opacity=".1"/>
    <text x="360" y="496" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${palette.accent}">${safeName}</text>
    <text x="360" y="556" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#a8a29e">${palette.label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function normalizeImage(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return fallback;
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
      const fallbackImage = stockFallbackImage(name, categoryName);
      products.push({
        id: `stock-${slugify(name)}`,
        name,
        description: stock === undefined
          ? "สินค้า DomiCha Stock • รอ HQ ยืนยันราคา/สต็อก"
          : `สินค้า DomiCha Stock • คลังกลาง ${stock.toLocaleString("th-TH")} ${unitFromName(name)}`,
        category: categoryName,
        price,
        unit: unitFromName(name),
        image: normalizeImage(images[name] || override?.image_url, fallbackImage),
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
    const fallbackImage = stockFallbackImage(name);
    products.push({
      id: `stock-${slugify(name)}`,
      name,
      description: `สินค้า DomiCha Stock • คลังกลาง ${stock.toLocaleString("th-TH")} ${unitFromName(name)}`,
      category: "สินค้า",
      price,
      unit: unitFromName(name),
      image: normalizeImage(images[name] || override?.image_url, fallbackImage),
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
