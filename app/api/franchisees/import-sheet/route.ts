import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type ImportRow = {
  branchCode?: string;
  ownerName?: string;
  shippingAddress?: string;
  phone?: string;
  taxId?: string;
  branchName?: string;
  province?: string;
  locationNote?: string;
};

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/117qoLgTd1LJnBFwzVcaGVeYiuG0-AXN621pzmtH7eBQ/export?format=csv&gid=0";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function sheetCellsToRows(rows: string[][]): ImportRow[] {
  return rows
    .filter((cells) => cells.length >= 7)
    .filter((cells) => cells[0]?.trim() !== "เลขสาขา")
    .map((cells) => ({
      branchCode: cells[0] || "",
      ownerName: cells[1] || "",
      shippingAddress: cells[2] || "",
      phone: cells[3] || "",
      taxId: cells[4] || "",
      branchName: cells[5] || "",
      province: cells[6] || "",
      locationNote: cells[10] || ""
    }));
}

function cleanBranchCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);
}

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

    const payload = (await request.json()) as { rows?: ImportRow[]; source?: "sheet" | "paste" };
    let rows = Array.isArray(payload.rows) ? payload.rows.slice(0, 200) : [];

    if (payload.source === "sheet") {
      const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      const text = await response.text();
      if (!response.ok || text.trim().startsWith("<!DOCTYPE")) {
        return NextResponse.json({ error: "Google Sheet ยังไม่ได้เปิดสิทธิ์ export CSV ให้ระบบอ่าน กรุณาใช้วิธี copy แถวจาก Sheet มาวางแทน" }, { status: 400 });
      }
      rows = sheetCellsToRows(parseCsv(text)).slice(0, 200);
    }

    if (!rows.length) return NextResponse.json({ error: "ไม่พบข้อมูลสำหรับนำเข้า" }, { status: 400 });

    const accounts: Array<{ branchCode: string; branchName: string; email: string; password: string; status: string }> = [];

    for (const row of rows) {
      const branchCode = cleanBranchCode(cleanText(row.branchCode, 40));
      const ownerName = cleanText(row.ownerName, 120);
      const branchName = cleanText(row.branchName, 140);
      const phone = cleanText(row.phone, 40);
      const province = cleanText(row.province, 80);
      const shippingAddress = cleanText(row.shippingAddress, 500);
      const taxId = cleanText(row.taxId, 40);
      const status = cleanText(row.locationNote, 40).includes("ปิด") ? "Suspended" : "Active";

      if (!branchCode || !ownerName || !branchName || !phone) continue;

      const email = emailFor(branchCode);
      const password = passwordFor(branchCode);
      let userId = await findAuthUserIdByEmail(admin, email);

      if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: ownerName,
            role: "Franchisee",
            branch_name: branchName,
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
            full_name: ownerName,
            role: "Franchisee",
            branch_name: branchName,
            branch_code: branchCode
          }
        });
        if (error) throw error;
      }

      const { error: userError } = await admin.from("users").upsert({
        id: userId,
        email,
        full_name: ownerName,
        role: "Franchisee"
      });
      if (userError) throw userError;

      const { data: branch, error: branchError } = await admin
        .from("branches")
        .upsert({
          branch_code: branchCode,
          branch_name: branchName,
          province,
          address: shippingAddress,
          status: status === "Suspended" ? "Inactive" : "Active"
        }, { onConflict: "branch_code" })
        .select("id")
        .single();
      if (branchError) throw branchError;

      const { error: profileError } = await admin.from("franchisee_profiles").upsert({
        user_id: userId,
        branch_id: branch.id,
        branch_name: branchName,
        owner_name: ownerName,
        phone,
        email,
        province,
        shipping_address: shippingAddress,
        tax_id: taxId && taxId !== "-" ? taxId : null,
        credit_limit: 0,
        payment_terms: "ชำระก่อนจัดส่ง",
        status,
        created_by: auth.user.id
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      accounts.push({ branchCode, branchName, email, password, status });
    }

    if (!accounts.length) {
      return NextResponse.json({ error: "นำเข้าไม่สำเร็จ เพราะระบบอ่านข้อมูลไม่ครบ ต้องมีเลขสาขา ชื่อลูกค้า เบอร์โทร และชื่อสาขา" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, imported: accounts.length, accounts });
  } catch (error) {
    return handleRouteError(error);
  }
}
