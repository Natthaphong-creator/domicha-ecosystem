import { NextResponse } from "next/server";
import { fetchStockProducts } from "@/lib/stockProducts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchStockProducts();
  return NextResponse.json(result);
}
