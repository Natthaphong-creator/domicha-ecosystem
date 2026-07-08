import { NextRequest, NextResponse } from "next/server";
import { fetchStockProducts } from "@/lib/stockProducts";
import { requireUserRole } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type OrderPayload = {
  customerName?: string;
  phone?: string;
  branchName?: string;
  deliveryMethod?: "delivery" | "pickup";
  address?: string;
  paymentMethod?: "transfer" | "cod";
  note?: string;
  items?: Array<{ productId?: string; quantity?: number }>;
};

const rateLimits = new Map<string, { count: number; resetAt: number }>();

const orderSelect = `
  id,
  order_number,
  franchisee_id,
  user_id,
  branch_id,
  delivery_method,
  shipping_address,
  payment_method,
  order_status,
  payment_status,
  subtotal,
  delivery_fee,
  grand_total,
  note,
  line_request_id,
  created_at,
  updated_at,
  franchisee_profiles(branch_name,owner_name,phone,email,province,shipping_address,tax_id,payment_terms),
  franchisee_order_items(id,product_id,product_name,unit,quantity,unit_price,line_total,created_at)
`;

function checkRateLimit(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function makeOrderNumber() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `DC-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function buildOrderFlexMessage(order: {
  orderNumber: string;
  customerName: string;
  phone: string;
  branchName: string;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  paymentMethod: "transfer" | "cod";
  note: string;
  itemLines: string[];
  deliveryFee: number;
  total: number;
}) {
  const money = (value: number) => `${value.toLocaleString("th-TH")} บาท`;
  return {
    type: "flex",
    altText: `ออเดอร์ใหม่ ${order.orderNumber} • ${money(order.total)}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: "#17120F",
        contents: [
          { type: "text", text: "DOMICHA • NEW ORDER", color: "#FB923C", size: "xs", weight: "bold" },
          { type: "text", text: "มีคำสั่งซื้อใหม่", color: "#FFFFFF", size: "xl", weight: "bold", margin: "sm" },
          { type: "text", text: order.orderNumber, color: "#D6D3D1", size: "sm", margin: "sm" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          { type: "text", text: order.customerName, size: "lg", weight: "bold", color: "#1C1917", wrap: true },
          { type: "text", text: `โทร ${order.phone} • ${order.branchName}`, size: "sm", color: "#78716C", wrap: true },
          { type: "separator" },
          ...order.itemLines.map((text) => ({ type: "text", text, size: "sm", color: "#292524", wrap: true })),
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "ยอดรวม", color: "#78716C", size: "sm" },
              { type: "text", text: money(order.total), color: "#EA580C", size: "lg", weight: "bold", align: "end" }
            ]
          },
          {
            type: "text",
            text: order.deliveryMethod === "delivery"
              ? `จัดส่ง: ${order.address}${order.deliveryFee ? ` (+${money(order.deliveryFee)})` : " (ฟรี)"}`
              : "รับสินค้าที่ศูนย์",
            size: "sm",
            color: "#57534E",
            wrap: true
          },
          { type: "text", text: `ชำระ: ${order.paymentMethod === "transfer" ? "โอนเงิน" : "เก็บเงินปลายทาง"}`, size: "sm", color: "#57534E" },
          ...(order.note ? [{ type: "text", text: `หมายเหตุ: ${order.note}`, size: "sm", color: "#9A3412", wrap: true }] : [])
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        backgroundColor: "#FFF7ED",
        contents: [{ type: "text", text: "กรุณาติดต่อลูกค้าเพื่อยืนยันออเดอร์", size: "sm", color: "#9A3412", weight: "bold", align: "center" }]
      }
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Sales", "Accountant", "Franchisee"]);
    if ("response" in auth) return auth.response;
    if (!("profile" in auth)) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 403 });
    }

    let query = auth.supabase
      .from("franchisee_orders")
      .select(orderSelect)
      .order("created_at", { ascending: false });

    if (auth.profile.role === "Franchisee") {
      query = query.eq("user_id", auth.user.id);
    }

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "โหลดรายการคำสั่งซื้อไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "พอร์ทัลแฟรนไชส์ซีต้องตั้งค่า Supabase ก่อนใช้งาน" }, { status: 503 });
  }

  const auth = await requireUserRole(request, ["Franchisee"]);
  if ("response" in auth) return auth.response;

  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: "ส่งคำสั่งซื้อถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  let payload: OrderPayload;
  try {
    payload = await request.json() as OrderPayload;
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { data: franchisee, error: franchiseeError } = await auth.supabase
    .from("franchisee_profiles")
    .select("id,user_id,branch_id,branch_name,owner_name,phone,shipping_address,status,payment_terms,credit_limit")
    .eq("user_id", auth.user.id)
    .single();

  if (franchiseeError || !franchisee) {
    return NextResponse.json({ error: "บัญชีนี้ยังไม่ได้ถูกเพิ่มเป็นแฟรนไชส์ซีโดย HQ" }, { status: 403 });
  }

  if (franchisee.status !== "Active") {
    return NextResponse.json({ error: "บัญชีแฟรนไชส์ซีนี้ยังไม่พร้อมใช้งาน กรุณาติดต่อ HQ" }, { status: 403 });
  }

  const customerName = cleanText(franchisee.owner_name, 80);
  const phone = cleanText(franchisee.phone, 20);
  const branchName = cleanText(franchisee.branch_name, 80);
  const address = cleanText(payload.address, 300);
  const note = cleanText(payload.note, 240);
  const deliveryMethod: "delivery" | "pickup" = payload.deliveryMethod === "pickup" ? "pickup" : "delivery";
  const paymentMethod: "transfer" | "cod" = payload.paymentMethod === "cod" ? "cod" : "transfer";

  if (!customerName) return NextResponse.json({ error: "กรุณาระบุชื่อลูกค้า" }, { status: 400 });
  if (!/^[0-9+\-\s]{9,20}$/.test(phone)) return NextResponse.json({ error: "กรุณาระบุเบอร์โทรให้ถูกต้อง" }, { status: 400 });
  if (!branchName) return NextResponse.json({ error: "กรุณาระบุชื่อสาขาหรือร้าน" }, { status: 400 });
  if (deliveryMethod === "delivery" && !address) return NextResponse.json({ error: "กรุณาระบุที่อยู่จัดส่ง" }, { status: 400 });
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: "ยังไม่มีสินค้าในคำสั่งซื้อ" }, { status: 400 });
  }

  const catalog = await fetchStockProducts();
  const productMap = new Map(catalog.products.map((product) => [product.id, product]));

  const normalizedItems = payload.items.map((item) => {
    const product = productMap.get(cleanText(item.productId, 160));
    const quantity = Math.floor(Number(item.quantity));
    if (!product || !Number.isFinite(quantity) || quantity < 1 || quantity > 99 || product.stock === 0) return null;
    return { product, quantity, lineTotal: product.price * quantity };
  });
  if (normalizedItems.some((item) => !item)) {
    return NextResponse.json({ error: "พบรายการสินค้าหรือจำนวนที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const validItems = normalizedItems.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const subtotal = validItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = deliveryMethod === "delivery" && subtotal > 0 && subtotal < 5_000 ? 80 : 0;
  const total = subtotal + deliveryFee;
  const orderNumber = makeOrderNumber();
  const { data: savedOrder, error: orderError } = await auth.supabase
    .from("franchisee_orders")
    .insert({
      order_number: orderNumber,
      franchisee_id: franchisee.id,
      user_id: auth.user.id,
      branch_id: franchisee.branch_id,
      delivery_method: deliveryMethod,
      shipping_address: deliveryMethod === "delivery" ? address : "",
      payment_method: paymentMethod,
      subtotal,
      delivery_fee: deliveryFee,
      grand_total: total,
      note
    })
    .select("id")
    .single();

  if (orderError || !savedOrder) {
    return NextResponse.json({ error: "บันทึกคำสั่งซื้อไม่สำเร็จ" }, { status: 500 });
  }

  const { error: itemsError } = await auth.supabase.from("franchisee_order_items").insert(
    validItems.map(({ product, quantity, lineTotal }) => ({
      franchisee_order_id: savedOrder.id,
      product_id: product.id,
      product_name: product.name,
      unit: product.unit,
      quantity,
      unit_price: product.price,
      line_total: lineTotal
    }))
  );

  if (itemsError) {
    return NextResponse.json({ error: "บันทึกรายการสินค้าไม่สำเร็จ" }, { status: 500 });
  }

  const order = {
    orderNumber,
    customerName,
    phone,
    branchName,
    deliveryMethod,
    address,
    paymentMethod,
    note,
    deliveryFee,
    total,
    itemLines: validItems.map(({ product, quantity, lineTotal }) =>
      `${product.name} × ${quantity} ${product.unit} • ${lineTotal.toLocaleString("th-TH")} บาท`
    )
  };

  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const targetId = process.env.LINE_OA_ORDER_TARGET_ID;
  if (!channelAccessToken || !targetId) {
    return NextResponse.json({
      ok: true,
      orderNumber,
      total,
      lineNotified: false,
      demoMode: false,
      message: "รับคำสั่งซื้อแล้ว (ยังไม่ได้ตั้งค่า LINE OA)"
    });
  }

  const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${channelAccessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: targetId, messages: [buildOrderFlexMessage(order)] })
  });

  if (!lineResponse.ok) {
    const detail = await lineResponse.text();
    return NextResponse.json({ error: "รับออเดอร์แล้ว แต่ LINE OA แจ้งเตือนไม่สำเร็จ", orderNumber, detail }, { status: 502 });
  }

  await auth.supabase
    .from("franchisee_orders")
    .update({ line_request_id: lineResponse.headers.get("x-line-request-id") || "" })
    .eq("id", savedOrder.id);

  return NextResponse.json({
    ok: true,
    orderNumber,
    total,
    lineNotified: true,
    requestId: lineResponse.headers.get("x-line-request-id") || ""
  });
}
