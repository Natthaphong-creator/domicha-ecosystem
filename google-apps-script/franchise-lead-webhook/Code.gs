const DEFAULT_SHEET_NAME = "Franchise Leads";
const DEFAULT_SPREADSHEET_NAME = "DomiCha Franchise Leads";

function doPost(e) {
  try {
    const payload = parsePayload_(e);
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

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body");
  }

  const payload = JSON.parse(e.postData.contents);
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
    name: "DomiCha Website"
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
