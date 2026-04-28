import { useState } from "react";
import { Search, FileSpreadsheet, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, Category } from "@/lib/expenses";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
  { code: "CNY", symbol: "¥", label: "CNY (¥)" },
  { code: "AUD", symbol: "A$", label: "AUD (A$)" },
  { code: "CAD", symbol: "C$", label: "CAD (C$)" },
  { code: "BRL", symbol: "R$", label: "BRL (R$)" },
  { code: "MXN", symbol: "Mex$", label: "MXN (Mex$)" },
  { code: "AED", symbol: "د.إ", label: "AED (د.إ)" },
  { code: "BDT", symbol: "৳", label: "BDT (৳)" },
];

type Props = {
  search: string; setSearch: (v: string) => void;
  category: "all" | Category; setCategory: (v: "all" | Category) => void;
  range: "all" | "7d" | "30d" | "month"; setRange: (v: any) => void;
  onExportCSV: (title: string) => void;
  onExportXLSX: (title: string) => void;
  onExportPDF: (title: string) => void;
  budget: number; setBudget: (n: number) => void;
  currency: string; setCurrency: (s: string) => void;
};

export function FiltersBar({
  search, setSearch, category, setCategory, range, setRange,
  onExportCSV, onExportXLSX, onExportPDF, budget, setBudget,
  currency, setCurrency,
}: Props) {
  const [reportTitle, setReportTitle] = useState("Expense Report");
  const title = reportTitle.trim() || "Expense Report";

  return (
    <div className="glass rounded-3xl p-4 flex flex-wrap items-center gap-3">
      
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expenses…"
          className="glass-input pl-9 rounded-xl border-white/40"
        />
      </div>

      <Select value={category} onValueChange={(v) => setCategory(v as any)}>
        <SelectTrigger className="glass-input rounded-xl border-white/40 w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent className="glass-strong border-white/40 rounded-xl">
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={range} onValueChange={setRange}>
        <SelectTrigger className="glass-input rounded-xl border-white/40 w-[130px]"><SelectValue /></SelectTrigger>
        <SelectContent className="glass-strong border-white/40 rounded-xl">
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="month">This month</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 w-full sm:w-auto ml-auto">
        
        {/* Report Name Input */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-xs text-muted-foreground ml-1">
            Name Your Expenses Report
          </label>
          <Input
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Report title (e.g. Tour expense)"
            className="glass-input rounded-xl border-white/40 w-full sm:w-[200px]"
            aria-label="Report title"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => onExportCSV(title)} className="glass-input border-white/40 rounded-xl flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={() => onExportXLSX(title)} className="glass-input border-white/40 rounded-xl flex-1 sm:flex-none">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
          <Button onClick={() => onExportPDF(title)} className="rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow flex-1 sm:flex-none">
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
        
      </div>
    </div>
  );
}