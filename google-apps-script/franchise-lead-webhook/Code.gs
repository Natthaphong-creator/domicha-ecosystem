const DEFAULT_SHEET_NAME = "Franchise Leads";
const DEFAULT_SPREADSHEET_NAME = "DomiCha Franchise Leads";
const DEFAULT_RECEIPT_ROOT_FOLDER_NAME = "DomiCha Receipts";
const DEFAULT_REPLY_TO_EMAIL = "domicha.tea@gmail.com";

function doPost(e) {
  try {
    const rawPayload = parseRawPayload_(e);
    if (rawPayload.type === "receipt") {
      return handleReceiptPost_(rawPayload);
    }

    const payload = parseLeadPayload_(rawPayload);
    const spreadsheet = getLeadSpreadsheet_();
    const sheet = getLeadSheet_(spreadsheet);
    const receivedAt = new Date();

    sheet.appendRow([
      receivedAt,
      payload.name || "",
      payload.contact || "",
      payload.location || "",
      payload.budget || "",
      payload.note || "",
      payload.source || "DomiCha Website",
      payload.createdAt || receivedAt.toISOString()
    ]);

    sendLeadEmail_(payload, spreadsheet.getUrl());

    return json_({
      ok: true,
      spreadsheetUrl: spreadsheet.getUrl()
    });
  } catch (error) {
    console.error(error);
    return json_({
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function authorizeReceiptAutomation() {
  const rootFolder = getReceiptRootFolder_();
  const testFolder = getOrCreateFolder_(rootFolder, "authorization-test");
  const testFile = testFolder.createFile("domicha-receipt-authorization.txt", "DomiCha receipt automation is authorized.");
  testFile.setTrashed(true);
  return "DomiCha receipt automation authorized";
}

function parseRawPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body");
  }

  return JSON.parse(e.postData.contents);
}

function parseLeadPayload_(payload) {
  return {
    name: String(payload.name || "").trim(),
    contact: String(payload.contact || "").trim(),
    location: String(payload.location || "").trim(),
    budget: String(payload.budget || "").trim(),
    note: String(payload.note || "").trim(),
    source: String(payload.source || "").trim(),
    createdAt: String(payload.createdAt || "").trim()
  };
}

function getLeadSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const sheetId = properties.getProperty("SHEET_ID");

  if (sheetId) {
    return SpreadsheetApp.openById(sheetId);
  }

  const spreadsheet = SpreadsheetApp.create(DEFAULT_SPREADSHEET_NAME);
  properties.setProperty("SHEET_ID", spreadsheet.getId());
  return spreadsheet;
}

function getLeadSheet_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(DEFAULT_SHEET_NAME) || spreadsheet.insertSheet(DEFAULT_SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headers = [
    "Received At",
    "Name",
    "Contact / LINE ID",
    "Province / Location",
    "Budget",
    "Note",
    "Source",
    "Created At"
  ];

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const isEmpty = currentHeaders.every(function (value) {
    return !value;
  });

  if (isEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.autoResizeColumns(1, headers.length);
  }
}

function sendLeadEmail_(payload, spreadsheetUrl) {
  const properties = PropertiesService.getScriptProperties();
  const fallbackEmail = Session.getEffectiveUser().getEmail();
  const emailTo = properties.getProperty("EMAIL_TO") || fallbackEmail;
  if (!emailTo) return;

  const subject = "Lead แฟรนไชส์ใหม่จากเว็บไซต์ DomiCha";
  const htmlBody = [
    "<h2>Lead แฟรนไชส์ใหม่จากเว็บไซต์ DomiCha</h2>",
    "<p><strong>ชื่อ:</strong> " + escapeHtml_(payload.name || "-") + "</p>",
    "<p><strong>ติดต่อ:</strong> " + escapeHtml_(payload.contact || "-") + "</p>",
    "<p><strong>จังหวัด / ทำเล:</strong> " + escapeHtml_(payload.location || "-") + "</p>",
    "<p><strong>งบประมาณ:</strong> " + escapeHtml_(payload.budget || "-") + "</p>",
    "<p><strong>รายละเอียด:</strong><br>" + escapeHtml_(payload.note || "-").replace(/\n/g, "<br>") + "</p>",
    "<p><a href=\"" + spreadsheetUrl + "\">เปิด Google Sheet</a></p>"
  ].join("");

  MailApp.sendEmail({
    to: emailTo,
    subject: subject,
    htmlBody: htmlBody,
    replyTo: getReplyToEmail_(),
    name: "DomiCha Thailand"
  });
}

function handleReceiptPost_(payload) {
  verifyReceiptSecret_(payload);

  const rootFolder = getReceiptRootFolder_();
  const monthFolderName = getReceiptMonthFolderName_(payload.receiptIssuedAt || new Date());
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
}

function verifyReceiptSecret_(payload) {
  const secret = PropertiesService.getScriptProperties().getProperty("RECEIPT_WEBHOOK_SECRET");
  if (secret && payload.secret !== secret) {
    throw new Error("Invalid webhook secret");
  }
}

function getReceiptRootFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty("RECEIPT_DRIVE_ROOT_FOLDER_ID");
  if (folderId) {
    return DriveApp.getFolderById(folderId);
  }
  return getOrCreateFolder_(DriveApp.getRootFolder(), DEFAULT_RECEIPT_ROOT_FOLDER_NAME);
}

function getReceiptMonthFolderName_(dateValue) {
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
  body.appendParagraph("วันที่ออกเอกสาร: " + formatReceiptDate_(payload.receiptIssuedAt || new Date()));
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
  (Array.isArray(payload.items) ? payload.items : []).forEach(function (item) {
    tableRows.push([
      String(item.productName || "-"),
      String(item.quantity || 0),
      String(item.unit || "-"),
      formatReceiptMoney_(item.unitPrice || 0),
      formatReceiptMoney_(item.lineTotal || 0)
    ]);
  });
  const table = body.appendTable(tableRows);
  table.getRow(0).editAsText().setBold(true);

  body.appendParagraph("");
  body.appendParagraph("ยอดสินค้า: " + formatReceiptMoney_(payload.subtotal || 0)).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph("ค่าจัดส่ง: " + formatReceiptMoney_(payload.deliveryFee || 0)).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph("ยอดสุทธิ: " + formatReceiptMoney_(payload.grandTotal || 0)).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
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
    "<strong>ยอดชำระ:</strong> " + escapeHtml_(formatReceiptMoney_(payload.grandTotal || 0)) + "</p>",
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

function formatReceiptDate_(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Utilities.formatDate(date, "Asia/Bangkok", "dd/MM/yyyy HH:mm");
}

function formatReceiptMoney_(value) {
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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
