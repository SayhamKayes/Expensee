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
};

// Lazy-load a Unicode TTF (Noto Sans) so symbols like ৳, ₹, د.إ render correctly.
let notoFontPromise: Promise<string | null> | null = null;
async function loadNotoBase64(): Promise<string | null> {
  if (!notoFontPromise) {
    notoFontPromise = (async () => {
      try {
        const res = await fetch("/fonts/NotoSans-Regular.ttf");
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buf);
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
        }
        return btoa(binary);
      } catch {
        return null;
      }
    })();
  }
  return notoFontPromise;
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
    return {
      headerLabel: safeCode,
      summaryPrefix: `${safeCode} `,
      rowPrefix: "",
    };
  }

  if ((useUnicode || PDF_SAFE_SYMBOLS.has(safeSymbol)) && safeSymbol) {
    return {
      headerLabel: safeSymbol,
      summaryPrefix: safeSymbol,
      rowPrefix: safeSymbol,
    };
  }

  const fallback = safeCode || safeSymbol || "CUR";
  const prefix = safeCode ? `${fallback} ` : fallback;

  return {
    headerLabel: fallback,
    summaryPrefix: prefix,
    rowPrefix: prefix,
  };
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// 1. Add this helper function at the top of your file. 
// Capacitor requires files to be in Base64 format to save them on mobile.
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};

// 2. Here is an example of how to update your CSV export
export const exportCSV = async (expenses: any[], options: any) => {
  const { title } = options;
  
  // ... (Keep your existing code that generates the CSV text) ...
  const csvContent = "Date,Purpose,Amount\n2024-01-01,Food,50"; // (Your actual CSV logic)

  if (Capacitor.isNativePlatform()) {
    // --- MOBILE BEHAVIOR ---
    try {
      // Write the file to the app's native cache directory
      const result = await Filesystem.writeFile({
        path: `${title}.csv`,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // Pop open the Android native Share menu!
      await Share.share({
        title: title,
        url: result.uri,
        dialogTitle: 'Export Expenses'
      });
    } catch (e) {
      console.error("Mobile export failed", e);
    }
  } else {
    // --- WEB/DESKTOP BEHAVIOR ---
    // (Keep your existing standard web download code here)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    link.click();
  }
};

export const exportPDF = async (expenses: any[], options: any) => {
  const { title } = options;
  
  // ... (Your existing PDF generation logic that creates a Blob) ...
  const pdfBlob = new Blob(); // Replace with your actual PDF blob

  if (Capacitor.isNativePlatform()) {
    // Convert Blob to Base64 for native saving
    const base64Data = await blobToBase64(pdfBlob);
    
    // We must remove the "data:application/pdf;base64," prefix that FileReader adds
    const cleanBase64 = base64Data.split(',')[1]; 

    const result = await Filesystem.writeFile({
      path: `${title}.pdf`,
      data: cleanBase64,
      directory: Directory.Cache
    });

    await Share.share({
      title: title,
      url: result.uri,
    });
  } else {
    // Standard web download...
  }
};

export const exportXLSX = async (expenses: any[], options: any) => {
  const { title } = options;

  // ... [KEEP YOUR EXISTING EXCEL GENERATION CODE HERE] ...
  
  // Let's assume your existing code produces this:
  const excelBlob = new Blob([/* your excel data */]); 

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Convert to Base64
      const base64Data = await blobToBase64(excelBlob);
      // 2. Strip off the data prefix that FileReader adds
      const cleanBase64 = base64Data.split(',')[1];

      // 3. Save to native cache
      const result = await Filesystem.writeFile({
        path: `${title}.xlsx`,
        data: cleanBase64,
        directory: Directory.Cache
      });

      // 4. Open Share Menu
      await Share.share({
        title: title,
        url: result.uri,
      });
    } catch (e) {
      console.error("Mobile Excel export failed", e);
    }
  } else {
    // --- WEB/DESKTOP BEHAVIOR ---
    // ... [KEEP YOUR EXISTING WEB DOWNLOAD CODE HERE] ...
  }
};