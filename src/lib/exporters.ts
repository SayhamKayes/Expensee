import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Expense } from "./expenses";
import { format } from "date-fns";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

type ExportOpts = {
  currency?: string;       
  currencyCode?: string;   
  title?: string;          
  exportRange?: "all" | "month" | "year" | "custom";
  customStart?: string;
  customEnd?: string;
};

function getRangeLabel(options: ExportOpts): string {
  if (options.exportRange === "custom" && options.customStart && options.customEnd) {
    return `Report Period: ${format(new Date(options.customStart), "MMM dd, yyyy")} to ${format(new Date(options.customEnd), "MMM dd, yyyy")}`;
  }
  if (options.exportRange === "month") return "Report Period: This Month";
  if (options.exportRange === "year") return "Report Period: This Year";
  return "Report Period: All Time";
}

function sanitizeFilename(name: string) {
  return (name || "expenses").trim().replace(/[^\w\-]+/g, "_").slice(0, 60) || "expenses";
}

function rows(expenses: Expense[], currency: string) {
  return expenses.map(e => ({
    Date: format(new Date(e.date), "yyyy-MM-dd"),
    Purpose: e.purpose,
    Category: e.category,
    [`Amount (${currency})`]: `${currency}${e.amount.toFixed(2)}`
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
  const rangeLabel = getRangeLabel(options);

  const header = ["Date", "Purpose", "Category", `Amount (${currency})`];
  const dataRows = rows(expenses, currency).map(r => 
    [r.Date, `"${r.Purpose}"`, r.Category, r[`Amount (${currency})`]]
  );
  
  const csvContent = [
    `"${title}"`, 
    `"${rangeLabel}"`, 
    "", 
    header.join(","), 
    ...dataRows.map(r => r.join(","))
  ].join("\n");

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: `${fileName}.csv`,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8 
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
  const rangeLabel = getRangeLabel(options);

  const header = ["Date", "Purpose", "Category", `Amount (${currency})`];
  const dataRows = rows(expenses, currency).map(r => 
    [r.Date, r.Purpose, r.Category, r[`Amount (${currency})`]]
  );

  const sheetData = [
    [title],
    [rangeLabel],
    [], 
    header,
    ...dataRows
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const result = await Filesystem.writeFile({
        path: `${fileName}.xlsx`,
        data: base64Data,
        directory: Directory.Cache
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
  const rangeLabel = getRangeLabel(options);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEntries = expenses.length;

  const doc = new jsPDF();
  const display = getPdfCurrencyDisplay(currency, currencyCode, false);

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0); 
  doc.text(title, 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100); 
  doc.text(rangeLabel, 14, 30);
  doc.text(`Currency: ${display.headerLabel}`, 14, 36);
  doc.text(`Total Entries: ${totalEntries}`, 14, 42);
  doc.text(`Total Amount: ${display.summaryPrefix}${totalAmount.toFixed(2)}`, 14, 48);

  const tableData = expenses.map(e => [
    format(new Date(e.date), "yyyy-MM-dd"),
    e.purpose,
    e.category,
    `${display.rowPrefix}${e.amount.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 56,
    head: [["Date", "Purpose", "Category", `Amount (${display.headerLabel})`]],
    body: tableData,
    foot: [["", "Total:", "", `${display.rowPrefix}${totalAmount.toFixed(2)}`]],
    footStyles: {
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],       
      fontStyle: "bold",          
    }
  });

  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring');
      const cleanBase64 = dataUri.split(',')[1];

      const result = await Filesystem.writeFile({
        path: `${fileName}.pdf`,
        data: cleanBase64,
        directory: Directory.Cache
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