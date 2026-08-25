import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type CreateFranchiseePayload = {
  email?: string;
  password?: string;
  ownerName?: string;
  branchName?: string;
  branchCode?: string;
  phone?: string;
  province?: string;
  shippingAddress?: string;
  taxId?: string;
  creditLimit?: number;
  paymentTerms?: string;
  status?: "Pending" | "Active" | "Suspended";
};

const franchiseeSelect = `
  id,
  branch_name,
  owner_name,
  phone,
  email,
  province,
  shipping_address,
  tax_id,
  credit_limit,
  payment_terms,
  status,
  created_at,
  branches(branch_code,branch_name)
`;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanBranchCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);
}

async function findAuthUserIdByEmail(admin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  if (!admin) return null;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 100) break;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Sales", "Accountant"]);
    if ("response" in auth) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });
    }

    const { data, error } = await admin
      .from("franchisee_profiles")
      .select(franchiseeSelect)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin"]);
    if ("response" in auth) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY สำหรับสร้างบัญชีแฟรนไชส์ซี" }, { status: 503 });
    }

    const payload = (await request.json()) as CreateFranchiseePayload;
    const email = cleanText(payload.email, 120).toLowerCase();
    const password = cleanText(payload.password, 80);
    const ownerName = cleanText(payload.ownerName, 120);
    const branchName = cleanText(payload.branchName, 140);
    const branchCode = cleanBranchCode(payload.branchCode || branchName || email.split("@")[0] || "");
    const phone = cleanText(payload.phone, 30);
    const province = cleanText(payload.province, 80);
    const shippingAddress = cleanText(payload.shippingAddress, 400);
    const taxId = cleanText(payload.taxId, 30);
    const paymentTerms = cleanText(payload.paymentTerms, 120) || "ชำระก่อนจัดส่ง";
    const status = payload.status || "Active";
    const creditLimit = Number.isFinite(Number(payload.creditLimit)) ? Math.max(0, Number(payload.creditLimit)) : 0;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "กรุณาระบุอีเมลแฟรนไชส์ซีให้ถูกต้อง" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    if (!ownerName) return NextResponse.json({ error: "กรุณาระบุชื่อเจ้าของสาขา" }, { status: 400 });
    if (!branchName) return NextResponse.json({ error: "กรุณาระบุชื่อสาขา" }, { status: 400 });
    if (!branchCode) return NextResponse.json({ error: "กรุณาระบุรหัสสาขา" }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "กรุณาระบุเบอร์โทร" }, { status: 400 });

    const { data: existingPublicUser, error: existingPublicUserError } = await admin
      .from("users")
      .select("id,email,role")
      .eq("email", email)
      .maybeSingle();
    if (existingPublicUserError) throw existingPublicUserError;

    if (existingPublicUser && existingPublicUser.role !== "Franchisee") {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้กับบัญชีหลังบ้านแล้ว กรุณาใช้อีเมลอื่นสำหรับแฟรนไชส์ซี" }, { status: 409 });
    }

    let userId = existingPublicUser?.id || "";

    if (!userId) {
      const { data: userData, error: createUserError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName,
          role: "Franchisee",
          branch_name: branchName
        }
      });

      if (createUserError || !userData.user) {
        const duplicateUserId = createUserError?.message.toLowerCase().includes("already")
          ? await findAuthUserIdByEmail(admin, email)
          : null;

        if (!duplicateUserId) {
          return NextResponse.json({ error: createUserError?.message || "สร้างบัญชีแฟรนไชส์ซีไม่สำเร็จ" }, { status: 400 });
        }

        userId = duplicateUserId;
      } else {
        userId = userData.user.id;
      }
    }

    const { error: updateAuthUserError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: ownerName,
        role: "Franchisee",
        branch_name: branchName
      }
    });
    if (updateAuthUserError) throw updateAuthUserError;

    const { error: userUpsertError } = await admin.from("users").upsert({
      id: userId,
      email,
      full_name: ownerName,
      role: "Franchisee"
    });
    if (userUpsertError) throw userUpsertError;

    const { data: branch, error: branchError } = await admin
      .from("branches")
      .upsert({
        branch_code: branchCode,
        branch_name: branchName,
        province,
        address: shippingAddress,
        status: "Active"
      }, { onConflict: "branch_code" })
      .select("id,branch_code,branch_name")
      .single();
    if (branchError) throw branchError;

    const { data: franchisee, error: profileError } = await admin
      .from("franchisee_profiles")
      .upsert({
        user_id: userId,
        branch_id: branch.id,
        branch_name: branchName,
        owner_name: ownerName,
        phone,
        email,
        province,
        shipping_address: shippingAddress,
        tax_id: taxId,
        credit_limit: creditLimit,
        payment_terms: paymentTerms,
        status,
        created_by: auth.user.id
      }, { onConflict: "user_id" })
      .select(franchiseeSelect)
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({ ok: true, franchisee, temporaryPassword: password }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
