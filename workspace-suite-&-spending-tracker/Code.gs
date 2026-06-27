function doGet() {
  // Automatically initialize database tables on first load
  try {
    initDatabase();
  } catch (e) {
    Logger.log("Database auto-provisioning failed: " + e.toString());
  }

  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Workspace Suite & Spending Tracker')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Checks for required sheets and creates them with headers if they are missing (Auto-provisioning).
 * Seeds default data if a new sheet is created.
 */
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return "Error: No active spreadsheet. Make sure this script is container-bound to a Google Sheet.";
  }

  var requiredSheets = {
    "Accounts": ["id", "name", "balance", "type", "icon"],
    "Transactions": ["id", "amount", "date", "category", "accountId", "fromAccountId", "toAccountId", "note", "type"],
    "Tasks": ["id", "title", "desc", "status", "priority", "dueDate", "createdAt", "completedAt"],
    "Presets": ["id", "label", "minutes", "icon"],
    "Habits": ["id", "title", "freq", "color"],
    "HabitLogs": ["date", "habitId", "checked"],
    "Categories": ["type", "name"]
  };

  for (var sheetName in requiredSheets) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(requiredSheets[sheetName]);
      
      // Format headers nicely
      sheet.getRange(1, 1, 1, requiredSheets[sheetName].length)
        .setFontWeight("bold")
        .setBackground("#e2e8f0")
        .setFontColor("#1e293b");
    }
  }

  // Seed Default Categories
  var catSheet = ss.getSheetByName("Categories");
  if (catSheet.getLastRow() <= 1) {
    var defaultCats = [
      ["Expense", "အစားအသောက်"],
      ["Expense", "အဝတ်အထည်"],
      ["Expense", "ခရီးသွားလာရေး"],
      ["Expense", "ဖျော်ဖြေရေး"],
      ["Expense", "အထွေထွေ"],
      ["Income", "လစာ"],
      ["Income", "စီးပွားရေး"],
      ["Income", "အထွေထွေ"]
    ];
    for (var i = 0; i < defaultCats.length; i++) {
      catSheet.appendRow(defaultCats[i]);
    }
  }

  // Seed Default Presets
  var presetSheet = ss.getSheetByName("Presets");
  if (presetSheet.getLastRow() <= 1) {
    var defaultPresets = [
      ["pres-1", "Learning", 25, "📚"],
      ["pres-2", "Deep Work", 50, "💻"],
      ["pres-3", "Break", 10, "🏃"]
    ];
    for (var i = 0; i < defaultPresets.length; i++) {
      presetSheet.appendRow(defaultPresets[i]);
    }
  }

  // Seed Default Habits
  var habitsSheet = ss.getSheetByName("Habits");
  if (habitsSheet.getLastRow() <= 1) {
    var defaultHabits = [
      ["hab-1", "web app", "Daily", "rose"],
      ["hab-2", "testingforhabit", "Daily", "rose"],
      ["hab-3", "test", "Daily", "rose"]
    ];
    for (var i = 0; i < defaultHabits.length; i++) {
      habitsSheet.appendRow(defaultHabits[i]);
    }
  }

  // Seed Default Habit Logs
  var habitLogsSheet = ss.getSheetByName("HabitLogs");
  if (habitLogsSheet.getLastRow() <= 1) {
    var defaultHabitLogs = [
      ["2026-06-25", "hab-1", true],
      ["2026-06-25", "hab-2", true],
      ["2026-06-25", "hab-3", true]
    ];
    for (var i = 0; i < defaultHabitLogs.length; i++) {
      habitLogsSheet.appendRow(defaultHabitLogs[i]);
    }
  }

  // Seed Default Accounts starting with zero balance as requested
  var accSheet = ss.getSheetByName("Accounts");
  if (accSheet.getLastRow() <= 1) {
    var defaultAccs = [
      ["cbpay", "CB pay", 0, "Bank", "smartphone"],
      ["wavepay", "wave pay", 0, "Bank", "smartphone"],
      ["kpay", "k pay", 0, "Bank", "smartphone"],
      ["cash", "Cash", 0, "Cash", "wallet"]
    ];
    for (var i = 0; i < defaultAccs.length; i++) {
      accSheet.appendRow(defaultAccs[i]);
    }
  }

  // Seed Default Tasks
  var tasksSheet = ss.getSheetByName("Tasks");
  if (tasksSheet.getLastRow() <= 1) {
    var defaultTasks = [
      ["T-1001", "Submit project proposal", "Monitor active accounts, log transactions, and schedule workloads.", "Pending", "High", "2026-06-25", "2026-06-23", ""],
      ["T-1002", "Prepare client presentation", "Draft Google Slides deck.", "Completed", "High", "2026-06-25", "2026-06-23", "2026-06-25"],
      ["T-1003", "Review and approve budget", "Audit departmental financial requests.", "Completed", "High", "2026-06-28", "2026-06-23", "2026-06-23"]
    ];
    for (var i = 0; i < defaultTasks.length; i++) {
      tasksSheet.appendRow(defaultTasks[i]);
    }
  }

  // Seed Initial Transactions so they represent the initial account balances
  var txSheet = ss.getSheetByName("Transactions");
  if (txSheet.getLastRow() <= 1) {
    var defaultTxs = [
      ["tx-seed-1", 30000, "2026-06-25", "အထွေထွေ", "cbpay", "", "", "CB pay Initial Balance", "Income"],
      ["tx-seed-2", 60000, "2026-06-25", "အထွေထွေ", "wavepay", "", "", "wave pay Initial Balance", "Income"],
      ["tx-seed-3", 70000, "2026-06-25", "အထွေထွေ", "kpay", "", "", "k pay Initial Balance", "Income"],
      ["tx-seed-4", 420000, "2026-06-25", "အထွေထွေ", "cash", "", "", "Cash Initial Balance", "Income"]
    ];
    for (var i = 0; i < defaultTxs.length; i++) {
      txSheet.appendRow(defaultTxs[i]);
    }
  }

  return "Success";
}

/**
 * Retrieves data from a specific sheet as an array of JSON objects.
 */
function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var val = values[i][j];
      if (val instanceof Date) {
        obj[header] = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        obj[header] = val;
      }
    }
    result.push(obj);
  }
  return result;
}

/**
 * Loads all workspace states from Google Sheets and returns a JSON string.
 */
function loadAllData() {
  try {
    initDatabase();
    var data = {
      accounts: getSheetData("Accounts"),
      transactions: getSheetData("Transactions"),
      tasks: getSheetData("Tasks"),
      presets: getSheetData("Presets"),
      habits: getSheetData("Habits"),
      habitLogs: getSheetData("HabitLogs"),
      categories: getSheetData("Categories")
    };
    return JSON.stringify(data);
  } catch (e) {
    return JSON.stringify({ error: e.toString() });
  }
}

/**
 * Helper to write a list of JS objects back into a Google Sheet using specified headers.
 */
function saveSheetData(sheetName, headers, dataArray) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  // Clear all data below header
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  if (!dataArray || dataArray.length === 0) return;
  
  var rows = [];
  for (var i = 0; i < dataArray.length; i++) {
    var item = dataArray[i];
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var val = item[header];
      if (val === undefined || val === null) {
        row.push("");
      } else {
        row.push(val);
      }
    }
    rows.push(row);
  }
  
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

/**
 * Saves all user workspace states back to their respective sheets.
 */
function saveAllData(dataJson) {
  try {
    var data = JSON.parse(dataJson);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return "Error: No active spreadsheet.";
    
    if (data.accounts) saveSheetData("Accounts", ["id", "name", "balance", "type", "icon"], data.accounts);
    if (data.transactions) saveSheetData("Transactions", ["id", "amount", "date", "category", "accountId", "fromAccountId", "toAccountId", "note", "type"], data.transactions);
    if (data.tasks) saveSheetData("Tasks", ["id", "title", "desc", "status", "priority", "dueDate", "createdAt", "completedAt"], data.tasks);
    if (data.presets) saveSheetData("Presets", ["id", "label", "minutes", "icon"], data.presets);
    if (data.habits) saveSheetData("Habits", ["id", "title", "freq", "color"], data.habits);
    if (data.habitLogs) saveSheetData("HabitLogs", ["date", "habitId", "checked"], data.habitLogs);
    
    if (data.categories) {
      saveSheetData("Categories", ["type", "name"], data.categories);
    }
    return "Success";
  } catch (e) {
    return "Error: " + e.toString();
  }
}
