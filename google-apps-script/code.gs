/**
 * Google Apps Script backend for Smart Guard Duty Management System.
 * Serves as a REST API endpoint connecting the React app to Google Sheets as the database.
 * Host this by publishing as a "Web App" with access set to "Anyone" (even anonymous).
 */

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "ping") {
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "pullAll") {
    try {
      const data = pullAllData();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    let result = false;
    
    switch (action) {
      case "syncGuards":
        result = syncTable("Guards", data);
        break;
      case "syncLocations":
        result = syncTable("Locations", data);
        break;
      case "syncLeaves":
        result = syncTable("Leaves", data);
        break;
      case "syncRosterHistory":
        result = syncTable("RosterHistory", data);
        break;
      case "syncAttendance":
        result = syncAttendanceRecord(data);
        break;
      case "syncSettings":
        result = syncTable("Settings", [data]); // Save settings as a single JSON config row
        break;
      default:
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown post action" }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (result) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Failed sync" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fetch all sheets and convert to structured JSON
function pullAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    guards: getSheetDataAsJson(ss, "Guards"),
    locations: getSheetDataAsJson(ss, "Locations"),
    leaves: getSheetDataAsJson(ss, "Leaves"),
    rosterHistory: getSheetDataAsJson(ss, "RosterHistory"),
    attendance: getSheetDataAsJson(ss, "Attendance"),
    settings: getSheetDataAsJson(ss, "Settings")[0] || null
  };
}

// Convert sheet to JSON arrays
function getSheetDataAsJson(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // Create it if it doesn't exist to prevent crash
    sheet = ss.insertSheet(sheetName);
    return [];
  }
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return []; // Only header or empty
  
  const headers = values[0];
  const jsonArr = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    let emptyRow = true;
    
    for (let j = 0; j < headers.length; j++) {
      let cellVal = row[j];
      // Check if value is JSON stringified (starts with { or [)
      if (typeof cellVal === "string" && (cellVal.startsWith("{") || cellVal.startsWith("["))) {
        try {
          cellVal = JSON.parse(cellVal);
        } catch (e) {}
      }
      obj[headers[j]] = cellVal;
      if (row[j] !== "") emptyRow = false;
    }
    
    if (!emptyRow) {
      jsonArr.push(obj);
    }
  }
  return jsonArr;
}

// Clear a sheet and overwrite with new rows
function syncTable(sheetName, items) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.clear();
  if (!items || items.length === 0) return true;
  
  // Extract headers
  const headers = Object.keys(items[0]);
  sheet.appendRow(headers);
  
  const rows = [];
  items.forEach(item => {
    const row = [];
    headers.forEach(h => {
      let val = item[h];
      if (typeof val === "object") {
        val = JSON.stringify(val);
      }
      row.push(val);
    });
    rows.push(row);
  });
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return true;
}

// Sync attendance roll for a specific date
function syncAttendanceRecord(payload) {
  const { date, records } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Attendance");
  
  if (!sheet) {
    sheet = ss.insertSheet("Attendance");
    sheet.appendRow(["date", "guardId", "status", "notes"]);
  }
  
  // Read existing records
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  
  const dateIdx = headers.indexOf("date");
  const guardIdIdx = headers.indexOf("guardId");
  
  // Collect indexes to delete (matching date)
  const rowsToDelete = [];
  for (let i = values.length - 1; i >= 1; i--) {
    // Format cell dates to compare strings
    const cellDateStr = values[i][dateIdx] instanceof Date 
      ? Utilities.formatDate(values[i][dateIdx], Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(values[i][dateIdx]);
      
    if (cellDateStr === date) {
      sheet.deleteRow(i + 1); // deleteRow is 1-indexed
    }
  }
  
  // Append new records
  records.forEach(rec => {
    sheet.appendRow([
      date,
      rec.guardId,
      rec.status,
      rec.notes || ""
    ]);
  });
  
  return true;
}
