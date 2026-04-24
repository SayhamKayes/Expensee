import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Expense } from "./expenses";
import { format } from "date-fns";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

type ExportOpts = {
  currency?: string;       // symbol for display in CSV/XLSX
  currencyCode?: string;   // ISO code, used in PDF for safe rendering
  title?: string;          // custom report title
};

function sanitizeFilename(name: string) {
  return (name || "expenses").trim().replace(/[^\w\-]+/g, "_").slice(0, 60) || "expenses";
}

function rows(expenses: Expense[], currency: string) {
  return expenses.map(e => ({
    Date: format(new Date(e.date), "yyyy-MM-dd"),
    Purpose: e.purpose,
    Category: e.category,
    [`Amount (${currency})`]: `${currency}${e.amount.toFixed(2)}`,
    Recurring: e.recurring || "no",
  }));
}

const PDF_SAFE_SYMBOLS = new Set(["$", "€", "£", "¥", "A$", "C$", "R$", "Mex$"]);

type PdfCurrencyDisplay = {
  headerLabel: string;
  summaryPrefix: string;
  rowPrefix: string;
};

function getPdfCurrencyDisplay(symbol: string, code?: string, useUnicode = false): PdfCurrencyDisplay {
  const safeSymbol = symbol.trim();
  const safeCode = code?.trim();

  if (safeCode === "BDT") {
    return { headerLabel: safeCode, summaryPrefix: `${safeCode} `, rowPrefix: "" };
  }

  if ((useUnicode || PDF_SAFE_SYMBOLS.has(safeSymbol)) && safeSymbol) {
    return { headerLabel: safeSymbol, summaryPrefix: safeSymbol, rowPrefix: safeSymbol };
  }

  const fallback = safeCode || safeSymbol || "CUR";
  const prefix = safeCode ? `${fallback} ` : fallback;

  return { headerLabel: fallback, summaryPrefix: prefix, rowPrefix: prefix };
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// EXPORT CSV
// ==========================================
export const exportCSV = async (expenses: Expense[], options: ExportOpts) => {
  const { currency = "$", title = "Expense Report" } = options;
  const fileName = sanitizeFilename(title);

  // Generate actual CSV string data
  const header = ["Date", "Purpose", "Category", `Amount (${currency})`, "Recurring"];
  const dataRows = rows(expenses, currency).map(r => 
    [r.Date, `"${r.Purpose}"`, r.Category, r[`Amount (${currency})`], r.Recurring]
  );
  const csvContent = [header.join(","), ...dataRows.map(r => r.join(","))].join("\n");

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: `${fileName}.csv`,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8 // Only use encoding for CSV
      });
      await Share.share({ title: fileName, url: result.uri });
    } catch (e) {
      console.error("Mobile CSV export failed", e);
    }
  } else {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    download(blob, `${fileName}.csv`);
  }
};

// ==========================================
// EXPORT XLSX (EXCEL)
// ==========================================
export const exportXLSX = async (expenses: Expense[], options: ExportOpts) => {
  const { currency = "$", title = "Expense Report" } = options;
  const fileName = sanitizeFilename(title);

  // Generate actual Excel Workbook
  const worksheet = XLSX.utils.json_to_sheet(rows(expenses, currency));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  if (Capacitor.isNativePlatform()) {
    try {
      // Get pure base64 directly from SheetJS
      const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

      const result = await Filesystem.writeFile({
        path: `${fileName}.xlsx`,
        data: base64Data,
        directory: Directory.Cache
        // NO ENCODING HERE
      });
      await Share.share({ title: fileName, url: result.uri });
    } catch (e) {
      console.error("Mobile Excel export failed", e);
    }
  } else {
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    download(blob, `${fileName}.xlsx`);
  }
};

// ==========================================
// EXPORT PDF
// ==========================================
export const exportPDF = async (expenses: Expense[], options: ExportOpts) => {
  const { currency = "$", currencyCode, title = "Expense Report" } = options;
  const fileName = sanitizeFilename(title);

  // 1. Calculate the totals
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEntries = expenses.length;

  // Generate actual PDF Document
  const doc = new jsPDF();
  const display = getPdfCurrencyDisplay(currency, currencyCode, false);

  // Draw the Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text(title, 14, 22);

  // 2. Draw the Summary Details
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100); // Subtle gray text for a professional look
  doc.text(`Currency: ${display.headerLabel}`, 14, 32);
  doc.text(`Total Entries: ${totalEntries}`, 14, 38);
  doc.text(`Total Amount: ${display.summaryPrefix}${totalAmount.toFixed(2)}`, 14, 44);

  const tableData = expenses.map(e => [
    format(new Date(e.date), "yyyy-MM-dd"),
    e.purpose,
    e.category,
    `${display.rowPrefix}${e.amount.toFixed(2)}`,
    e.recurring ? "Yes" : "No"
  ]);

  // 3. Draw the Table (Pushed startY down to 52 to make room for the text)
  autoTable(doc, {
    startY: 52,
    head: [["Date", "Purpose", "Category", `Amount (${display.headerLabel})`, "Recurring"]],
    body: tableData,
    
    // 1. ADD THE FOOTER ARRAY
    foot: [["", "", "Total:", `${display.rowPrefix}${totalAmount.toFixed(2)}`, ""]],
    
    // 2. ADD STYLING TO MAKE IT POP
    footStyles: {
      fillColor: [240, 240, 240], // Light gray background
      textColor: [0, 0, 0],       // Black text
      fontStyle: "bold",          // Make it bold so it stands out
    }
  });

  if (Capacitor.isNativePlatform()) {
    try {
      // Get base64 string directly from jsPDF
      const dataUri = doc.output('datauristring');
      const cleanBase64 = dataUri.split(',')[1]; // Strip prefix

      const result = await Filesystem.writeFile({
        path: `${fileName}.pdf`,
        data: cleanBase64,
        directory: Directory.Cache
        // NO ENCODING HERE
      });
      await Share.share({ title: fileName, url: result.uri });
    } catch (e) {
      console.error("Mobile PDF export failed", e);
    }
  } else {
    const blob = doc.output('blob');
    download(blob, `${fileName}.pdf`);
  }
};