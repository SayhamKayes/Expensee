import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { AddExpenseCard } from "@/components/AddExpenseCard";
import { StatsPanel } from "@/components/StatsPanel";
import { FiltersBar } from "@/components/FiltersBar";
import { ExpenseList } from "@/components/ExpenseList";
import { Category, CATEGORIES, Expense } from "@/lib/expenses";
import { exportCSV, exportPDF, exportXLSX } from "@/lib/exporters";
import { isAfter, startOfMonth, subDays } from "date-fns";
import { Wallet, X, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { MobileShell, MobileTab } from "@/components/MobileShell";
import { MobileDashboard, MobileCategories, MobileGraph } from "@/components/MobileViews";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDarkMode } from "@/hooks/useDarkMode"; 

const Index = () => {
  // 1. Destructured the new updateExpense function here!
  const { expenses, budget, currency, addExpense, removeExpense, updateExpense, setBudget, setCurrency } = useExpenses();
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
  
  // 2. Added State to track which expense is currently being edited
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // <-- Initialize Dark Mode Hook here
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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
            {/* Added onEdit prop here */}
            <ExpenseList expenses={filtered} currency={currency} onRemove={removeExpense} onEdit={setEditingExpense} />
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

      {/* DESKTOP LAYOUT */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6 hidden md:block">
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
          
          {/* <-- Container for the Toggle and the Badge --> */}
          <div className="hidden sm:flex items-center gap-3">
            
            <button
              onClick={toggleDarkMode}
              className="glass-input rounded-full h-9 w-9 flex items-center justify-center border border-white/40 hover:bg-white/20 transition-all shrink-0"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              All data saved locally
            </div>

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

        {/* Added onEdit prop here */}
        <ExpenseList expenses={filtered} currency={currency} onRemove={removeExpense} onEdit={setEditingExpense} />

        <div className="flex flex-col items-center gap-2 pt-4 pb-2">
          <p className="text-center text-xs text-muted-foreground">
            Built with glass • {expenses.length} total expenses tracked
          </p>
          <Footer />
        </div>
      </div>

      {/* 3. The Custom Edit Modal Popup */}
      {editingExpense && (
        <EditExpenseModal 
          expense={editingExpense} 
          onClose={() => setEditingExpense(null)} 
          onSave={(id, updatedData) => {
            updateExpense(id, updatedData);
            setEditingExpense(null);
            toast.success("Expense updated successfully!");
          }} 
        />
      )}

    </div>
  );
};

// ==============================================================
// Mini Component to handle the Edit Form cleanly
// ==============================================================
function EditExpenseModal({ 
  expense, 
  onClose, 
  onSave 
}: { 
  expense: Expense; 
  onClose: () => void; 
  onSave: (id: string, data: Partial<Expense>) => void; 
}) {
  const [purpose, setPurpose] = useState(expense.purpose);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState<Category>(expense.category as Category);

  const handleSave = () => {
    if (!purpose.trim() || !amount) return toast.error("Please fill all fields");
    onSave(expense.id, {
      purpose,
      amount: parseFloat(amount),
      category
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 rounded-full hover:bg-white/20 text-muted-foreground" 
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <h2 className="text-xl font-bold mb-6">Edit Expense</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground ml-1">Purpose</label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="glass-input rounded-xl border-white/40 mt-1"
            />
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground ml-1">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input rounded-xl border-white/40 mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground ml-1">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="glass-input rounded-xl border-white/40 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/40 rounded-xl">
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button
             className="w-full rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow mt-4"
             onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Index;