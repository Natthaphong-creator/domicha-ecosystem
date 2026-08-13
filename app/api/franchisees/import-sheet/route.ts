import { NextRequest, NextResponse } from "next/server";
import { franchiseeSheetSeed } from "@/lib/franchiseeSheetSeed";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function passwordFor(branchCode: string) {
  return `DomiCha@${branchCode}`;
}

function emailFor(branchCode: string) {
  return `${branchCode.toLowerCase()}@domichathailand.com`;
}

async function findAuthUserIdByEmail(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 100) break;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Manager"]);
    if ("response" in auth) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY สำหรับนำเข้าบัญชีแฟรนไชส์ซี" }, { status: 503 });
    }

    const results: Array<{ branchCode: string; branchName: string; email: string; password: string; status: string }> = [];

    for (const item of franchiseeSheetSeed) {
      const email = emailFor(item.branchCode);
      const password = passwordFor(item.branchCode);
      const branchCode = item.branchCode.toUpperCase();

      let userId = await findAuthUserIdByEmail(admin, email);
      if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: item.ownerName,
            role: "Franchisee",
            branch_name: item.branchName,
            branch_code: branchCode
          }
        });
        if (error || !data.user) throw error || new Error(`สร้างบัญชี ${email} ไม่สำเร็จ`);
        userId = data.user.id;
      } else {
        const { error } = await admin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: item.ownerName,
            role: "Franchisee",
            branch_name: item.branchName,
            branch_code: branchCode
          }
        });
        if (error) throw error;
      }

      const { error: userError } = await admin.from("users").upsert({
        id: userId,
        email,
        full_name: item.ownerName,
        role: "Franchisee"
      });
      if (userError) throw userError;

      const { data: branch, error: branchError } = await admin
        .from("branches")
        .upsert({
          branch_code: branchCode,
          branch_name: item.branchName,
          province: item.province,
          address: item.shippingAddress,
          status: item.status === "Suspended" ? "Inactive" : "Active"
        }, { onConflict: "branch_code" })
        .select("id")
        .single();
      if (branchError) throw branchError;

      const { error: profileError } = await admin.from("franchisee_profiles").upsert({
        user_id: userId,
        branch_id: branch.id,
        branch_name: item.branchName,
        owner_name: item.ownerName,
        phone: item.phone,
        email,
        province: item.province,
        shipping_address: item.shippingAddress,
        tax_id: item.taxId || null,
        credit_limit: 0,
        payment_terms: "ชำระก่อนจัดส่ง",
        status: item.status,
        created_by: auth.user.id
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      results.push({ branchCode, branchName: item.branchName, email, password, status: item.status });
    }

    return NextResponse.json({ ok: true, imported: results.length, accounts: results });
  } catch (error) {
    return handleRouteError(error);
  }
}
