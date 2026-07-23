import { NextResponse } from "next/server";
import { getDomiChaSystemSummary } from "@/lib/domichaSystem";

export async function GET() {
  const summary = await getDomiChaSystemSummary();
  return NextResponse.json(summary);
}
