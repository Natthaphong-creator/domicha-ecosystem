import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

type LeadPayload = {
  name?: string;
  contact?: string;
  location?: string;
  budget?: string;
  note?: string;
};

const columns = "id,name,contact,location,budget,note,source,status,assigned_to,last_contacted_at,internal_note,created_at,updated_at";
const statuses = ["New", "Contacted", "Qualified", "PackageSent", "Won", "Lost"] as const;

type NotificationResult = {
  label: string;
  sent: boolean;
  error?: string;
};

function cleanText(value: unknown, max = 240) {
  return String(value || "").trim().slice(0, max);
}

function validateLead(lead: Required<LeadPayload>) {
  if (!lead.name) return "กรุณาระบุชื่อผู้ติดต่อ";
  if (!lead.contact) return "กรุณาระบุเบอร์โทรหรือ LINE ID";
  return "";
}

function leadNotificationBody(lead: Required<LeadPayload>) {
  return {
    ...lead,
    source: "DomiCha Website",
    createdAt: new Date().toISOString()
  };
}

async function sendToWebhook(lead: Required<LeadPayload>): Promise<NotificationResult> {
  const webhookUrl = process.env.DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL;
  if (!webhookUrl) return { label: "Google Sheet/Email", sent: false };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadNotificationBody(lead))
    });

    if (!response.ok) throw new Error(`Webhook rejected franchise lead (${response.status})`);
    return { label: "Google Sheet/Email", sent: true };
  } catch (error) {
    console.error("Franchise lead webhook notification failed", error);
    return {
      label: "Google Sheet/Email",
      sent: false,
      error: error instanceof Error ? error.message : "Webhook notification failed"
    };
  }
}

async function sendToLine(lead: Required<LeadPayload>): Promise<NotificationResult> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const targetId = process.env.LINE_FRANCHISE_LEAD_TARGET_ID;
  if (!channelAccessToken || !targetId) return { label: "LINE OA", sent: false };

  const text = [
    "มี Lead แฟรนไชส์ใหม่จากเว็บไซต์ DomiCha",
    `ชื่อ: ${lead.name}`,
    `ติดต่อ: ${lead.contact}`,
    `ทำเล: ${lead.location || "-"}`,
    `งบ: ${lead.budget || "-"}`,
    `หมายเหตุ: ${lead.note || "-"}`
  ].join("\n");

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channelAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ to: targetId, messages: [{ type: "text", text }] })
    });

    if (!response.ok) throw new Error(`LINE rejected franchise lead (${response.status})`);
    return { label: "LINE OA", sent: true };
  } catch (error) {
    console.error("Franchise lead LINE notification failed", error);
    return {
      label: "LINE OA",
      sent: false,
      error: error instanceof Error ? error.message : "LINE notification failed"
    };
  }
}

async function saveLead(lead: Required<LeadPayload>) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("franchise_leads")
    .insert({
      name: lead.name,
      contact: lead.contact,
      location: lead.location || null,
      budget: lead.budget || null,
      note: lead.note || null,
      source: "DomiCha Website"
    })
    .select(columns)
    .single();

  if (error) throw error;
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Executive", "Manager", "AssistantManager"]);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase
      .from("franchise_leads")
      .select(columns)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as LeadPayload;
    const lead = {
      name: cleanText(payload.name, 120),
      contact: cleanText(payload.contact, 80),
      location: cleanText(payload.location, 160),
      budget: cleanText(payload.budget, 80),
      note: cleanText(payload.note, 400)
    };

    const validation = validateLead(lead);
    if (validation) return NextResponse.json({ error: validation }, { status: 400 });

    const savedLead = await saveLead(lead);
    const notificationResults = await Promise.all([sendToWebhook(lead), sendToLine(lead)]);
    const destinations: string[] = [];
    if (savedLead) destinations.push("ระบบหลังบ้าน");
    destinations.push(...notificationResults.filter((result) => result.sent).map((result) => result.label));
    const notificationErrors = notificationResults.filter((result) => result.error);

    return NextResponse.json({
      ok: true,
      message: destinations.length
        ? `รับข้อมูลแล้ว ส่งต่อไปยัง ${destinations.join(" และ ")} เรียบร้อย`
        : "รับข้อมูลตัวอย่างแล้ว ตั้งค่า Google Sheet/Email หรือ LINE OA เพื่อส่ง lead จริง",
      notificationErrors: notificationErrors.length ? notificationErrors : undefined
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ส่งข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Manager", "AssistantManager"]);
    if ("response" in auth) return auth.response;

    const payload = await request.json();
    const id = cleanText(payload.id, 80);
    if (!id) return NextResponse.json({ error: "ไม่พบ Lead ที่ต้องการแก้ไข" }, { status: 400 });

    const nextStatus = cleanText(payload.status, 40);
    const updatePayload: Record<string, string | null> = {};
    if (nextStatus) {
      if (!statuses.includes(nextStatus as (typeof statuses)[number])) {
        return NextResponse.json({ error: "สถานะ Lead ไม่ถูกต้อง" }, { status: 400 });
      }
      updatePayload.status = nextStatus;
      if (nextStatus !== "New") updatePayload.last_contacted_at = new Date().toISOString();
    }
    if ("internal_note" in payload) updatePayload.internal_note = cleanText(payload.internal_note, 500) || null;

    const { data, error } = await auth.supabase
      .from("franchise_leads")
      .update(updatePayload)
      .eq("id", id)
      .select(columns)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
