import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { fetchStockProducts } from "@/lib/stockProducts";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,product_code,product_name,category,unit,cost_price,selling_price,image_url,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";
const columnsWithoutImage = "id,product_code,product_name,category,unit,cost_price,selling_price,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";

function productCode(name: string) {
  const hash = createHash("sha1").update(name).digest("hex").slice(0, 8).toUpperCase();
  return `STK-${hash}`;
}

function cleanCategory(value: string) {
  return value.replace(/[^\p{L}\p{N}\s/&.-]/gu, "").replace(/\s+/g, " ").trim() || "สินค้า";
}

function isMissingImageColumn(error: unknown) {
  return JSON.stringify(error).includes("image_url");
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const catalog = await fetchStockProducts();
    const rows = catalog.products.map((product) => ({
      product_code: productCode(product.name),
      product_name: product.name,
      category: cleanCategory(product.category),
      unit: product.unit || "ชิ้น",
      cost_price: 0,
      selling_price: product.price || 0,
      image_url: null,
      vat_type: "VAT 7%",
      minimum_stock: typeof product.stock === "number" && product.stock > 0 ? product.stock : 0,
      supplier_id: null,
      status: "Active",
      created_by: auth.user.id
    }));

    if (!rows.length) {
      return NextResponse.json({ imported: 0, total: 0, source: catalog.source });
    }

    const { data, error } = await auth.supabase
      .from("products")
      .upsert(rows, { onConflict: "product_code", ignoreDuplicates: true })
      .select(columns);

    if (!error) {
      return NextResponse.json({ imported: data?.length || 0, total: rows.length, source: catalog.source });
    }

    if (!isMissingImageColumn(error)) throw error;

    const rowsWithoutImage = rows.map(({ image_url: _imageUrl, ...row }) => row);
    const fallback = await auth.supabase
      .from("products")
      .upsert(rowsWithoutImage, { onConflict: "product_code", ignoreDuplicates: true })
      .select(columnsWithoutImage);

    if (fallback.error) throw fallback.error;
    return NextResponse.json({ imported: fallback.data?.length || 0, total: rows.length, source: catalog.source, imageColumnMissing: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
