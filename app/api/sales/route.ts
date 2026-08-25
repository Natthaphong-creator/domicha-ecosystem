import { NextRequest, NextResponse } from "next/server";
import { recordSalesDocumentStockOut } from "@/lib/franchiseeOrderAccounting";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

type SalePayload = {
  customerId?: string;
  issueDate?: string;
  dueDate?: string;
  paymentTermDays?: number;
  discount?: number;
  sendLine?: boolean;
  lineUserId?: string;
  notes?: string;
  items?: Array<{
    productId?: string;
    productName?: string;
    quantity?: number;
    unitPrice?: number;
    discount?: number;
  }>;
};

type ProductRow = {
  id: string;
  product_name: string;
  selling_price: number;
};

const allowedRoles = ["Admin", "Executive", "Manager", "AssistantManager", "Sales", "Accountant"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function moneyNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isUuid(value?: string) {
  return Boolean(value && uuidPattern.test(value));
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function makeDocumentNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${datePart}-${randomPart}`;
}

async function sendLineInvoice(payload: {
  lineUserId: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  dueDate: string;
  invoiceUrl: string;
}) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) return { status: "not_configured" as const, requestId: "", error: "" };

  const formattedTotal = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2
  }).format(payload.total);

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: payload.lineUserId,
      messages: [
        {
          type: "flex",
          altText: `ใบแจ้งหนี้ ${payload.invoiceNumber} ยอด ${formattedTotal}`,
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              paddingAll: "20px",
              backgroundColor: "#111827",
              contents: [
                { type: "text", text: "DOMICHA BUSINESS", color: "#FB923C", size: "xs", weight: "bold" },
                { type: "text", text: "ใบแจ้งหนี้", color: "#FFFFFF", size: "xl", weight: "bold", margin: "md" },
                { type: "text", text: payload.invoiceNumber, color: "#CBD5E1", size: "sm", margin: "sm" }
              ]
            },
            body: {
              type: "box",
              layout: "vertical",
              paddingAll: "20px",
              spacing: "md",
              contents: [
                { type: "text", text: payload.customerName, size: "md", weight: "bold", color: "#111827", wrap: true },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "ยอดชำระ", size: "sm", color: "#64748B", flex: 2 },
                    { type: "text", text: formattedTotal, size: "md", color: "#EA580C", weight: "bold", align: "end", flex: 3 }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "ครบกำหนด", size: "sm", color: "#64748B", flex: 2 },
                    { type: "text", text: payload.dueDate, size: "sm", color: "#111827", align: "end", flex: 3 }
                  ]
                }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              paddingAll: "20px",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#F97316",
                  action: { type: "uri", label: "เปิดดูใบแจ้งหนี้", uri: payload.invoiceUrl }
                }
              ]
            }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    return { status: "failed" as const, requestId: "", error: await response.text() };
  }

  return { status: "sent" as const, requestId: response.headers.get("x-line-request-id") || "", error: "" };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, allowedRoles);
    if ("response" in auth) return auth.response;

    const payload = (await request.json()) as SalePayload;
    if (!isUuid(payload.customerId)) {
      return NextResponse.json({ error: "กรุณาเลือกลูกค้าจากระบบ" }, { status: 400 });
    }

    const validItems = (payload.items || [])
      .map((item) => ({
        productId: isUuid(item.productId) ? item.productId : null,
        productName: item.productName?.trim() || "",
        quantity: Math.max(0, moneyNumber(item.quantity)),
        unitPrice: Math.max(0, moneyNumber(item.unitPrice)),
        discount: Math.max(0, moneyNumber(item.discount))
      }))
      .filter((item) => item.quantity > 0 && (item.productId || item.productName));

    if (validItems.length === 0) {
      return NextResponse.json({ error: "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ" }, { status: 400 });
    }

    const { data: customer, error: customerError } = await auth.supabase
      .from("customers")
      .select("id,customer_name,line_user_id,auto_send_invoice_line")
      .eq("id", payload.customerId)
      .single();
    if (customerError) throw customerError;

    const productIds = validItems.map((item) => item.productId).filter(Boolean) as string[];
    const productMap = new Map<string, ProductRow>();
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await auth.supabase
        .from("products")
        .select("id,product_name,selling_price")
        .in("id", productIds);
      if (productsError) throw productsError;
      (products || []).forEach((product) => productMap.set(product.id, product as ProductRow));
    }

    const normalizedItems = validItems.map((item) => {
      const product = item.productId ? productMap.get(item.productId) : null;
      const unitPrice = item.unitPrice || moneyNumber(product?.selling_price);
      const productName = item.productName || product?.product_name || "สินค้า";
      const lineBeforeVat = Math.max(0, item.quantity * unitPrice - item.discount);
      return {
        product_id: item.productId || null,
        product_name: productName,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount: item.discount,
        vat_amount: Number((lineBeforeVat * 0.07).toFixed(2)),
        line_total: Number((lineBeforeVat * 1.07).toFixed(2))
      };
    });

    const issueDate = payload.issueDate || new Date().toISOString().slice(0, 10);
    const dueDate = payload.dueDate || addDays(issueDate, moneyNumber(payload.paymentTermDays));
    const subtotal = normalizedItems.reduce((total, item) => total + item.quantity * item.unit_price, 0);
    const discountTotal = Math.min(Math.max(0, moneyNumber(payload.discount)), subtotal);
    const taxable = Math.max(0, subtotal - discountTotal);
    const vatTotal = Number((taxable * 0.07).toFixed(2));
    const grandTotal = Number((taxable + vatTotal).toFixed(2));

    const { data: document, error: documentError } = await auth.supabase
      .from("sales_documents")
      .insert({
        document_number: makeDocumentNumber(),
        document_type: "Invoice",
        customer_id: payload.customerId,
        issue_date: issueDate,
        due_date: dueDate,
        status: "Pending",
        subtotal: Number(subtotal.toFixed(2)),
        discount_total: Number(discountTotal.toFixed(2)),
        vat_total: vatTotal,
        grand_total: grandTotal,
        notes: payload.notes || null,
        created_by: auth.user.id
      })
      .select("id,document_number")
      .single();
    if (documentError) throw documentError;

    const { error: itemError } = await auth.supabase
      .from("sales_document_items")
      .insert(normalizedItems.map((item) => ({ ...item, sales_document_id: document.id })));
    if (itemError) throw itemError;

    const stockMovement = await recordSalesDocumentStockOut({
      salesDocumentId: document.id,
      documentNumber: document.document_number,
      createdBy: auth.user.id,
      items: normalizedItems
    });

    let lineStatus: "sent" | "skipped" | "failed" | "not_configured" = "skipped";
    const targetLineUserId = payload.lineUserId?.trim() || customer.line_user_id || "";
    if (payload.sendLine && targetLineUserId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const delivery = await sendLineInvoice({
        lineUserId: targetLineUserId,
        invoiceNumber: document.document_number,
        customerName: customer.customer_name,
        total: grandTotal,
        dueDate,
        invoiceUrl: `${appUrl}/documents`
      });
      lineStatus = delivery.status;
      await auth.supabase.from("line_delivery_logs").insert({
        sales_document_id: document.id,
        customer_id: payload.customerId,
        recipient_id: targetLineUserId,
        status: delivery.status === "sent" ? "Sent" : "Failed",
        line_request_id: delivery.requestId || null,
        error_message: delivery.error || (delivery.status === "not_configured" ? "LINE_CHANNEL_ACCESS_TOKEN is not configured" : null),
        sent_at: delivery.status === "sent" ? new Date().toISOString() : null,
        created_by: auth.user.id
      });
    }

    return NextResponse.json({
      ok: true,
      invoiceNumber: document.document_number,
      saleDocument: document,
      stockMovement,
      lineStatus
    }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
