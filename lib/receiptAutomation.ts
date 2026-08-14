import type { FranchiseeOrder } from "@/lib/types";

type ReceiptAutomationItem = {
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptAutomationResult = {
  attempted: boolean;
  ok: boolean;
  emailSent?: boolean;
  driveFileUrl?: string;
  monthFolderName?: string;
  skippedReason?: "not_configured" | "missing_email";
  error?: string;
};

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getProfile(order: FranchiseeOrder) {
  const profile = order.franchisee_profiles as FranchiseeOrder["franchisee_profiles"] | FranchiseeOrder["franchisee_profiles"][];
  return Array.isArray(profile) ? profile[0] : profile;
}

function buildReceiptPayload(order: FranchiseeOrder) {
  const profile = getProfile(order);
  const items: ReceiptAutomationItem[] = (order.franchisee_order_items || []).map((item) => ({
    productName: item.product_name,
    unit: item.unit,
    quantity: toNumber(item.quantity),
    unitPrice: toNumber(item.unit_price),
    lineTotal: toNumber(item.line_total)
  }));

  return {
    type: "receipt",
    secret: process.env.DOMICHA_RECEIPT_AUTOMATION_SECRET || "",
    receiptNumber: order.receipt_number,
    receiptIssuedAt: order.receipt_issued_at,
    orderNumber: order.order_number,
    orderCreatedAt: order.created_at,
    customerEmail: profile?.email || "",
    customerName: profile?.owner_name || profile?.branch_name || "",
    branchName: profile?.branch_name || "",
    customerPhone: profile?.phone || "",
    customerTaxId: profile?.tax_id || "",
    customerAddress: profile?.shipping_address || order.shipping_address || "",
    paymentReference: order.payment_reference || "",
    promptpayAccountName: order.promptpay_account_name || "",
    subtotal: toNumber(order.subtotal),
    deliveryFee: toNumber(order.delivery_fee),
    grandTotal: toNumber(order.grand_total),
    note: order.note || "",
    items
  };
}

export async function deliverReceiptAutomation(order: FranchiseeOrder): Promise<ReceiptAutomationResult> {
  const webhookUrl = process.env.DOMICHA_RECEIPT_AUTOMATION_WEBHOOK_URL;
  if (!webhookUrl) {
    return { attempted: false, ok: false, skippedReason: "not_configured" };
  }

  if (!getProfile(order)?.email) {
    return { attempted: false, ok: false, skippedReason: "missing_email" };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildReceiptPayload(order))
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) {
      return {
        attempted: true,
        ok: false,
        error: result.error || `Receipt automation failed with HTTP ${response.status}`
      };
    }

    return {
      attempted: true,
      ok: true,
      emailSent: Boolean(result.emailSent),
      driveFileUrl: typeof result.driveFileUrl === "string" ? result.driveFileUrl : undefined,
      monthFolderName: typeof result.monthFolderName === "string" ? result.monthFolderName : undefined
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
