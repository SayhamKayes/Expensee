import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { AddExpenseCard } from "@/components/AddExpenseCard";
import { StatsPanel } from "@/components/StatsPanel";
import { FiltersBar } from "@/components/FiltersBar";
import { ExpenseList } from "@/components/ExpenseList";
import { Category } from "@/lib/expenses";
import { exportCSV, exportPDF, exportXLSX } from "@/lib/exporters";
import { isAfter, startOfMonth, subDays } from "date-fns";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { MobileShell, MobileTab } from "@/components/MobileShell";
import { MobileDashboard, MobileCategories, MobileGraph } from "@/components/MobileViews";

const Index = () => {
  const { expenses, budget, currency, addExpense, removeExpense, setBudget, setCurrency } = useExpenses();
  const CURRENCY_CODE_MAP: Record<string, string> = {
    "$": "USD", "€": "EUR", "£": "GBP", "₹": "INR", "¥": "JPY",
    "A$": "AUD", "C$": "CAD", "R$": "BRL", "Mex$": "MXN",
    "د.إ": "AED", "৳": "BDT",
  };
  const currencyCode = CURRENCY_CODE_MAP[currency] ?? "";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [range, setRange] = useState<"all" | "7d" | "30d" | "month">("all");
  const [mobileTab, setMobileTab] = useState<MobileTab>("dashboard");

  const filtered = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (search && !e.purpose.toLowerCase().includes(search.toLowerCase())) return false;
      const d = new Date(e.date);
      if (range === "7d" && !isAfter(d, subDays(now, 7))) return false;
      if (range === "30d" && !isAfter(d, subDays(now, 30))) return false;
      if (range === "month" && !isAfter(d, startOfMonth(now))) return false;
      return true;
    });
  }, [expenses, search, category, range]);

  const guard = (fn: () => void) => () => {
    if (!filtered.length) return toast.error("Nothing to export");
    fn();
    toast.success("Export started");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl blob" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-accent/30 blur-3xl blob" style={{ animationDelay: "-6s" }} />

      {/* MOBILE LAYOUT */}
      <MobileShell active={mobileTab} onChange={setMobileTab}>
        {mobileTab === "dashboard" && (
          <>
            <MobileDashboard expenses={expenses} budget={budget} currency={currency} setBudget={setBudget} />
            <FiltersBar
              search={search} setSearch={setSearch}
              category={category} setCategory={setCategory}
              range={range} setRange={setRange}
              budget={budget} setBudget={setBudget}
              currency={currency} setCurrency={setCurrency}
              onExportCSV={(title) => guard(() => exportCSV(filtered, { currency, currencyCode, title }))()}
              onExportXLSX={(title) => guard(() => exportXLSX(filtered, { currency, currencyCode, title }))()}
              onExportPDF={(title) => guard(() => exportPDF(filtered, { currency, currencyCode, title }))()}
            />
            <ExpenseList expenses={filtered} currency={currency} onRemove={removeExpense} />
          </>
        )}
        {mobileTab === "categories" && (
          <MobileCategories expenses={expenses} currency={currency} />
        )}
        {mobileTab === "graph" && (
          <MobileGraph expenses={expenses} currency={currency} />
        )}
        {mobileTab === "add" && (
          <AddExpenseCard onAdd={addExpense} />
        )}
      </MobileShell>

      {/* DESKTOP LAYOUT (Hidden on mobile via 'hidden md:block') */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6 hidden md:block">
        
        {/* Header - Preserved your custom Expensee logo and tagline */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[55px] h-[20px] rounded-2xl flex items-center justify-center">
              <img src="../../Expensee_logo_final.png" alt="Expensee Logo"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Expensee</h1>
              <p className="text-xs text-primary-foreground">Record Expense | Track it | Export it.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 glass rounded-full px-4 py-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            All data saved locally
          </div>
        </header>

        <StatsPanel expenses={expenses} budget={budget} currency={currency} setBudget={setBudget} />

        <AddExpenseCard onAdd={addExpense} />

        <FiltersBar
          search={search} setSearch={setSearch}
          category={category} setCategory={setCategory}
          range={range} setRange={setRange}
          budget={budget} setBudget={setBudget}
          currency={currency} setCurrency={setCurrency}
          onExportCSV={(title) => guard(() => exportCSV(filtered, { currency, currencyCode, title }))()}
          onExportXLSX={(title) => guard(() => exportXLSX(filtered, { currency, currencyCode, title }))()}
          onExportPDF={(title) => guard(() => exportPDF(filtered, { currency, currencyCode, title }))()}
        />

        <ExpenseList expenses={filtered} currency={currency} onRemove={removeExpense} />

        {/* Footer - Preserved your copyright block */}
        <div className="flex flex-col items-center gap-2 pt-4 pb-2">
          <p className="text-center text-xs text-muted-foreground">
            Built with glass • {expenses.length} total expenses tracked
          </p>
          <Footer />
        </div>

      </div>
    </div>
  );
};

export default Index;