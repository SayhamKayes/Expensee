import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Expense } from "./expenses";
import { format } from "date-fns";

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

export function exportCSV(expenses: Expense[], opts: ExportOpts = {}) {
  const { currency = "$", title = "Expense Report" } = opts;
  const data = rows(expenses, currency);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const amountKey = `Amount (${currency})`;
  const headers = Object.keys(data[0] ?? { Date: "", Purpose: "", Category: "", [amountKey]: "", Recurring: "" });
  const csv = [
    `Title:,${JSON.stringify(title)}`,
    `Currency:,${currency}`,
    `Generated:,${format(new Date(), "yyyy-MM-dd HH:mm")}`,
    "",
    headers.join(","),
    ...data.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? "")).join(",")),
    "",
    `,,Total,${currency}${total.toFixed(2)},`,
  ].join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${sanitizeFilename(title)}.csv`);
}

export function exportXLSX(expenses: Expense[], opts: ExportOpts = {}) {
  const { currency = "$", title = "Expense Report" } = opts;
  const data = rows(expenses, currency);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.sheet_add_aoa(ws, [["", "", "Total", `${currency}${total.toFixed(2)}`, ""]], { origin: -1 });
  XLSX.utils.sheet_add_aoa(ws, [[`Title: ${title}`]], { origin: -1 });
  XLSX.utils.sheet_add_aoa(ws, [[`Currency: ${currency}`]], { origin: -1 });
  ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  XLSX.writeFile(wb, `${sanitizeFilename(title)}.xlsx`);
}

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

export async function exportPDF(expenses: Expense[], opts: ExportOpts = {}) {
  const { currency = "$", currencyCode, title = "Expense Report" } = opts;
  const doc = new jsPDF();

  // Try to register the Unicode font; if it fails, fall back to ISO code text.
  let useUnicode = false;
  const b64 = await loadNotoBase64();
  if (b64) {
    try {
      doc.addFileToVFS("NotoSans-Regular.ttf", b64);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      doc.setFont("NotoSans", "normal");
      useUnicode = true;
    } catch {
      useUnicode = false;
    }
  }
  const currencyDisplay = getPdfCurrencyDisplay(currency, currencyCode, useUnicode);
  const formatSummaryAmount = (amount: number) => `${currencyDisplay.summaryPrefix}${amount.toFixed(2)}`;
  const formatRowAmount = (amount: number) => `${currencyDisplay.rowPrefix}${amount.toFixed(2)}`;
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  doc.setFontSize(20);
  doc.text(title, 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated ${format(new Date(), "PPP")}`, 14, 28);
  doc.text(`Currency: ${currencyDisplay.headerLabel}  •  Total: ${formatSummaryAmount(total)}  •  ${expenses.length} entries`, 14, 34);

  autoTable(doc, {
    startY: 42,
    head: [["Date", "Purpose", "Category", `Amount (${currencyDisplay.headerLabel})`]],
    body: expenses.map(e => [
      format(new Date(e.date), "yyyy-MM-dd"),
      e.purpose,
      e.category,
      formatRowAmount(e.amount),
    ]),
    foot: [["", "", "Total", formatRowAmount(total)]],
    headStyles: { fillColor: [124, 58, 237], font: useUnicode ? "NotoSans" : "helvetica" },
    footStyles: { fillColor: [240, 240, 245], textColor: 20, fontStyle: "bold", font: useUnicode ? "NotoSans" : "helvetica" },
    styles: { fontSize: 10, font: useUnicode ? "NotoSans" : "helvetica" },
  });
  doc.save(`${sanitizeFilename(title)}.pdf`);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
