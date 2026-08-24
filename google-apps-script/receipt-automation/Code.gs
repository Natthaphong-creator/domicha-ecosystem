const DEFAULT_ROOT_FOLDER_NAME = "DomiCha Receipts";
const DEFAULT_REPLY_TO_EMAIL = "domicha.tea@gmail.com";

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    verifySecret_(payload);

    const rootFolder = getRootFolder_();
    const monthFolderName = getMonthFolderName_(payload.receiptIssuedAt || new Date());
    const monthFolder = getOrCreateFolder_(rootFolder, monthFolderName);
    const pdfFile = createReceiptPdf_(payload, monthFolder);
    const emailSent = sendReceiptEmail_(payload, pdfFile);

    return json_({
      ok: true,
      emailSent: emailSent,
      driveFileId: pdfFile.getId(),
      driveFileUrl: pdfFile.getUrl(),
      monthFolderName: monthFolderName,
      monthFolderUrl: monthFolder.getUrl()
    });
  } catch (error) {
    console.error(error);
    return json_({
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body");
  }
  const payload = JSON.parse(e.postData.contents);
  payload.items = Array.isArray(payload.items) ? payload.items : [];
  return payload;
}

function verifySecret_(payload) {
  const secret = PropertiesService.getScriptProperties().getProperty("RECEIPT_WEBHOOK_SECRET");
  if (secret && payload.secret !== secret) {
    throw new Error("Invalid webhook secret");
  }
}

function getRootFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty("DRIVE_ROOT_FOLDER_ID");
  if (folderId) {
    return DriveApp.getFolderById(folderId);
  }
  return getOrCreateFolder_(DriveApp.getRootFolder(), DEFAULT_ROOT_FOLDER_NAME);
}

function getMonthFolderName_(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Utilities.formatDate(date, "Asia/Bangkok", "yyyy-MM");
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

function createReceiptPdf_(payload, folder) {
  const receiptNumber = payload.receiptNumber || "RECEIPT";
  const doc = DocumentApp.create("DomiCha Receipt " + receiptNumber);
  const body = doc.getBody();
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(42).setMarginRight(42);

  body.appendParagraph("DomiCha Thailand").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("ใบเสร็จรับเงิน / Receipt").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("เลขที่ใบเสร็จ: " + receiptNumber);
  body.appendParagraph("เลขที่ออเดอร์: " + (payload.orderNumber || "-"));
  body.appendParagraph("วันที่ออกเอกสาร: " + formatDate_(payload.receiptIssuedAt || new Date()));
  body.appendParagraph("");

  body.appendParagraph("ข้อมูลลูกค้า").setHeading(DocumentApp.ParagraphHeading.HEADING3);
  body.appendParagraph("ชื่อสาขา: " + (payload.branchName || "-"));
  body.appendParagraph("ผู้ติดต่อ: " + (payload.customerName || "-"));
  body.appendParagraph("โทร: " + (payload.customerPhone || "-"));
  body.appendParagraph("อีเมล: " + (payload.customerEmail || "-"));
  body.appendParagraph("เลขประจำตัวผู้เสียภาษี: " + (payload.customerTaxId || "-"));
  body.appendParagraph("ที่อยู่จัดส่ง/ออกเอกสาร: " + (payload.customerAddress || "-"));
  body.appendParagraph("");

  const tableRows = [["สินค้า", "จำนวน", "หน่วย", "ราคา/หน่วย", "รวม"]];
  payload.items.forEach(function (item) {
    tableRows.push([
      String(item.productName || "-"),
      String(item.quantity || 0),
      String(item.unit || "-"),
      formatMoney_(item.unitPrice || 0),
      formatMoney_(item.lineTotal || 0)
    ]);
  });
  const table = body.appendTable(tableRows);
  table.getRow(0).editAsText().setBold(true);

  body.appendParagraph("");
  body.appendParagraph("ยอดสินค้า: " + formatMoney_(payload.subtotal || 0)).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph("ค่าจัดส่ง: " + formatMoney_(payload.deliveryFee || 0)).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph("ยอดสุทธิ: " + formatMoney_(payload.grandTotal || 0)).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph("");
  body.appendParagraph("ช่องทางชำระเงิน: พร้อมเพย์ " + (payload.promptpayAccountName || "บริษัท โดมิพลัสกรุ๊ป จำกัด"));
  body.appendParagraph("เลขอ้างอิงการชำระเงิน: " + (payload.paymentReference || "-"));
  body.appendParagraph("");
  body.appendParagraph("เอกสารนี้ออกโดยระบบ DomiCha หลังทีมตรวจสอบการชำระเงินเรียบร้อยแล้ว");

  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const pdfBlob = docFile.getAs(MimeType.PDF).setName(receiptNumber + " - " + (payload.branchName || payload.orderNumber || "DomiCha") + ".pdf");
  const pdfFile = folder.createFile(pdfBlob);
  docFile.setTrashed(true);
  return pdfFile;
}

function sendReceiptEmail_(payload, pdfFile) {
  if (!payload.customerEmail) {
    return false;
  }

  const subject = "ใบเสร็จรับเงิน DomiCha " + (payload.receiptNumber || payload.orderNumber || "");
  const htmlBody = [
    "<p>เรียน " + escapeHtml_(payload.customerName || payload.branchName || "ลูกค้าแฟรนไชส์ซี") + "</p>",
    "<p>ทีม DomiCha ตรวจสอบการชำระเงินเรียบร้อยแล้ว และแนบใบเสร็จรับเงินมาในอีเมลนี้</p>",
    "<p><strong>เลขที่ออเดอร์:</strong> " + escapeHtml_(payload.orderNumber || "-") + "<br>",
    "<strong>เลขที่ใบเสร็จ:</strong> " + escapeHtml_(payload.receiptNumber || "-") + "<br>",
    "<strong>ยอดชำระ:</strong> " + escapeHtml_(formatMoney_(payload.grandTotal || 0)) + "</p>",
    "<p>ขอบคุณที่ไว้วางใจ DomiCha</p>"
  ].join("");

  MailApp.sendEmail({
    to: payload.customerEmail,
    subject: subject,
    htmlBody: htmlBody,
    attachments: [pdfFile.getBlob()],
    replyTo: getReplyToEmail_(),
    name: "DomiCha Thailand"
  });

  return true;
}

function getReplyToEmail_() {
  return PropertiesService.getScriptProperties().getProperty("REPLY_TO_EMAIL") || DEFAULT_REPLY_TO_EMAIL;
}

function formatDate_(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Utilities.formatDate(date, "Asia/Bangkok", "dd/MM/yyyy HH:mm");
}

function formatMoney_(value) {
  return "THB " + Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
