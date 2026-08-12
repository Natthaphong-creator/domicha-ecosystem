import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getLineChannelAccessToken } from "@/lib/lineMessaging";

type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  source?: {
    type?: "user" | "group" | "room";
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    type?: string;
    text?: string;
  };
};

type LineWebhookBody = {
  events?: LineWebhookEvent[];
};

function verifyLineSignature(bodyText: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const digest = createHmac("sha256", secret).update(bodyText).digest("base64");
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);
  return signatureBuffer.length === digestBuffer.length && timingSafeEqual(signatureBuffer, digestBuffer);
}

function getTargetId(event: LineWebhookEvent) {
  if (event.source?.type === "group") return event.source.groupId || "";
  if (event.source?.type === "room") return event.source.roomId || "";
  return event.source?.userId || "";
}

function isSetupCommand(text: string) {
  const normalized = text.trim().toLowerCase();
  return ["ตั้งค่าแจ้งเตือน", "แจ้งเตือนแฟรนไชส์", "แจ้งเตือน", "ทดสอบ", "test", "lead"].some((keyword) => normalized.includes(keyword));
}

async function replyLine(replyToken: string | undefined, text: string) {
  const channelAccessToken = await getLineChannelAccessToken();
  if (!channelAccessToken || !replyToken) return;

  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }]
    })
  });

  if (!response.ok) {
    console.error("LINE webhook reply failed", response.status, await response.text());
  }
}

async function saveLineWebhookLog(event: LineWebhookEvent) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { error } = await supabase.from("site_settings").upsert({
    key: "line_webhook_last_event",
    value: {
      eventType: event.type,
      messageType: event.message?.type || "",
      text: event.message?.text || "",
      sourceType: event.source?.type || "",
      hasTargetId: Boolean(getTargetId(event)),
      updatedAt: new Date().toISOString()
    }
  });

  if (error) console.error("Save LINE webhook log failed", error);
}

async function saveLeadTarget(event: LineWebhookEvent) {
  const targetId = getTargetId(event);
  if (!targetId) return false;

  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("site_settings").upsert({
    key: "line_franchise_lead_target",
    value: {
      targetId,
      sourceType: event.source?.type || "user",
      updatedAt: new Date().toISOString()
    }
  });

  if (error) {
    console.error("Save LINE lead target failed", error);
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  if (!verifyLineSignature(bodyText, request.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "Invalid LINE signature" }, { status: 401 });
  }

  let body: LineWebhookBody;
  try {
    body = JSON.parse(bodyText) as LineWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = body.events || [];
  await Promise.all(events.map(async (event) => {
    await saveLineWebhookLog(event);
    if (event.type !== "message" || event.message?.type !== "text") return;

    const text = event.message.text || "";
    if (!isSetupCommand(text)) return;

    const saved = await saveLeadTarget(event);
    await replyLine(event.replyToken, saved ? "รับข้อมูลแล้ว" : "ยังตั้งค่าแจ้งเตือนไม่สำเร็จครับ");
  }));

  return NextResponse.json({ ok: true, received: events.length });
}
