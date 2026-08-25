import { NextRequest, NextResponse } from "next/server";
import { syncDomiChaHistory } from "@/lib/domichaHistoryImport";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

const allowedRoles = ["Admin", "Executive", "Manager", "AssistantManager", "Accountant"];

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, allowedRoles);
    if ("response" in auth) return auth.response;

    const result = await syncDomiChaHistory(auth.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
