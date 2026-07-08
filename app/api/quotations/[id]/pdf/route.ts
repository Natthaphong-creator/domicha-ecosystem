import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

function safeText(value: unknown) {
  return String(value ?? "-").replace(/[^\x20-\x7E]/g, "?");
}

function baht(value: unknown) {
  return `THB ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data: quotation, error } = await auth.supabase
      .from("quotations")
      .select("*,customers(customer_name,email,phone,billing_address),quotation_items(*)")
      .eq("id", params.id)
      .single();
    if (error) throw error;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const green = rgb(0.18, 0.44, 0.31);

    page.drawText("DomiCha Quotation", { x: 48, y: 790, size: 22, font: bold, color: green });
    page.drawText(`Quotation No: ${safeText(quotation.quotation_number)}`, { x: 48, y: 755, size: 11, font });
    page.drawText(`Date: ${safeText(quotation.quotation_date)}`, { x: 48, y: 738, size: 11, font });
    page.drawText(`Status: ${safeText(quotation.status)}`, { x: 48, y: 721, size: 11, font });
    page.drawText(`Customer: ${safeText(quotation.customers?.customer_name)}`, { x: 330, y: 755, size: 11, font });
    page.drawText(`Phone: ${safeText(quotation.customers?.phone)}`, { x: 330, y: 738, size: 11, font });
    page.drawText(`Email: ${safeText(quotation.customers?.email)}`, { x: 330, y: 721, size: 11, font });

    const headers = ["Product", "Qty", "Unit", "Disc.", "VAT", "Total"];
    const xs = [48, 260, 315, 380, 445, 505];
    page.drawRectangle({ x: 42, y: 682, width: 512, height: 24, color: rgb(0.94, 0.96, 0.92) });
    headers.forEach((header, index) => page.drawText(header, { x: xs[index], y: 690, size: 10, font: bold, color: green }));

    let y = 660;
    for (const item of quotation.quotation_items || []) {
      page.drawText(safeText(item.product_name).slice(0, 34), { x: 48, y, size: 9, font });
      page.drawText(safeText(item.quantity), { x: 260, y, size: 9, font });
      page.drawText(baht(item.unit_price), { x: 315, y, size: 9, font });
      page.drawText(baht(item.discount), { x: 380, y, size: 9, font });
      page.drawText(baht(item.vat_amount), { x: 445, y, size: 9, font });
      page.drawText(baht(item.line_total), { x: 505, y, size: 9, font });
      y -= 22;
    }

    page.drawLine({ start: { x: 42, y: 150 }, end: { x: 554, y: 150 }, thickness: 1, color: rgb(0.82, 0.82, 0.82) });
    page.drawText(`Subtotal: ${baht(quotation.subtotal)}`, { x: 380, y: 120, size: 11, font });
    page.drawText(`Discount: ${baht(quotation.discount_total)}`, { x: 380, y: 100, size: 11, font });
    page.drawText(`VAT 7%: ${baht(quotation.vat_total)}`, { x: 380, y: 80, size: 11, font });
    page.drawText(`Grand Total: ${baht(quotation.grand_total)}`, { x: 380, y: 55, size: 13, font: bold, color: green });

    const bytes = await pdfDoc.save();
    const filePath = `quotations/${quotation.id}/${quotation.quotation_number}.pdf`;

    await auth.supabase.storage.from("documents").upload(filePath, Buffer.from(bytes), {
      contentType: "application/pdf",
      upsert: true
    });

    await auth.supabase.from("document_files").insert({
      related_table: "quotations",
      related_id: quotation.id,
      document_type: "quotation_pdf",
      file_name: `${quotation.quotation_number}.pdf`,
      storage_path: filePath,
      created_by: auth.user.id
    });

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quotation.quotation_number}.pdf"`
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
