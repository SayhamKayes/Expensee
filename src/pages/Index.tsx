import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { AddExpenseCard } from "@/components/AddExpenseCard";
import { StatsPanel } from "@/components/StatsPanel";
import { FiltersBar } from "@/components/FiltersBar";
import { ExpenseList } from "@/components/ExpenseList";
import { Category, CATEGORIES, Expense } from "@/lib/expenses";
import { exportCSV, exportPDF, exportXLSX } from "@/lib/exporters";
import { isAfter, startOfMonth, subDays, startOfYear, startOfDay, endOfDay, isBefore } from "date-fns";
import { Wallet, X, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { MobileShell, MobileTab } from "@/components/MobileShell";
import { MobileDashboard, MobileCategories, MobileGraph } from "@/components/MobileViews";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "@/hooks/useAuth";
import { syncToGoogleDrive, downloadFromGoogleDrive } from "@/lib/googleDrive";

const Index = () => {
  // 1. Destructured the new updateExpense and setExpenses functions here!
  const { expenses, budget, currency, addExpense, removeExpense, updateExpense, setBudget, setCurrency, setExpenses } = useExpenses();
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

  const { user, signIn, signOut } = useAuth();

  const handleBackup = async () => {
    if (!user || !user.authentication.accessToken) {
      return toast.error("Please log in to backup data");
    }
    
    try {
      toast.info("Uploading to Google Drive...", { id: "sync" });
      
      // Package up their entire app state
      const appData = { expenses, budget, currency };
      
      // Send it to Google Drive!
      await syncToGoogleDrive(user.authentication.accessToken, appData);
      
      toast.success("Backup complete! Safe in the cloud.", { id: "sync" });
    } catch (error) {
      toast.error("Failed to backup. Try again.", { id: "sync" });
    }
  };

  const handleRestore = async () => {
    if (!user || !user.authentication.accessToken) {
      return toast.error("Please log in to restore data");
    }
    
    try {
      toast.info("Checking Google Drive for backups...", { id: "sync" });
      
      // Pull the data down from Google Drive
      const cloudData = await downloadFromGoogleDrive(user.authentication.accessToken);
      
      if (cloudData && cloudData.expenses) {
        // 1. Overwrite the local state
        setExpenses(cloudData.expenses);
        if (cloudData.budget) setBudget(cloudData.budget);
        if (cloudData.currency) setCurrency(cloudData.currency);
        
        // 2. Force save it to local storage so it survives a refresh
        localStorage.setItem("expensee-expenses", JSON.stringify(cloudData.expenses));
        if (cloudData.budget) localStorage.setItem("expensee-budget", JSON.stringify(cloudData.budget));
        if (cloudData.currency) localStorage.setItem("expensee-currency", JSON.stringify(cloudData.currency));
        
        toast.success("Data successfully restored from the cloud!", { id: "sync" });
      } else {
        toast.error("No backup file found in your Google Drive.", { id: "sync" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore data. Try again.", { id: "sync" });
    }
  };

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

  // <-- Helper to refine the list of filtered expenses specifically for the export -->
  const filterExpensesForExport = (data: { exportRange: string; customStart: string; customEnd: string }) => {
    const { exportRange, customStart, customEnd } = data;
    const now = new Date();

    return filtered.filter((e) => {
      const expenseDate = startOfDay(new Date(e.date));

      if (exportRange === "month") {
        return (isAfter(expenseDate, startOfMonth(now)) || expenseDate.getTime() === startOfMonth(now).getTime());
      }
      if (exportRange === "year") {
        return (isAfter(expenseDate, startOfYear(now)) || expenseDate.getTime() === startOfYear(now).getTime());
      }
      if (exportRange === "custom" && customStart && customEnd) {
        const sD = startOfDay(new Date(customStart));
        const eD = endOfDay(new Date(customEnd));
        return (expenseDate.getTime() >= sD.getTime() && expenseDate.getTime() <= eD.getTime());
      }
      return true; // "all"
    });
  };

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
            <MobileDashboard expenses={expenses} budget={budget} currency={currency} setBudget={setBudget} user={user} signIn={signIn} signOut={signOut} handleBackup={handleBackup} handleRestore={handleRestore} setCurrency={setCurrency} />
            <FiltersBar
              search={search} setSearch={setSearch}
              category={category} setCategory={setCategory}
              range={range} setRange={setRange}
              budget={budget} setBudget={setBudget}
              currency={currency} setCurrency={setCurrency}
              
              // <-- Updated Export Callbacks -->
              onExportCSV={(data) => {
                const refinedData = filterExpensesForExport(data);
                guard(() => exportCSV(refinedData, { 
                  currency, 
                  currencyCode, 
                  title: data.title,
                  exportRange: data.exportRange,
                  customStart: data.customStart, 
                  customEnd: data.customEnd 
                }))();
              }}
              onExportXLSX={(data) => {
                const refinedData = filterExpensesForExport(data);
                guard(() => exportXLSX(refinedData, { 
                  currency, 
                  currencyCode, 
                  title: data.title,
                  exportRange: data.exportRange,
                  customStart: data.customStart, 
                  customEnd: data.customEnd 
                }))();
              }}
              onExportPDF={(data) => {
                const refinedData = filterExpensesForExport(data);
                guard(() => exportPDF(refinedData, { 
                  currency, 
                  currencyCode, 
                  title: data.title,
                  exportRange: data.exportRange,
                  customStart: data.customStart, 
                  customEnd: data.customEnd 
                }))();
              }}
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
          
          {/* <-- Container for the Toggle, Login, and Badge --> */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* If logged in, show their profile pic & logout button. If not, show Login button */}
            {user ? (
              <div className="flex items-center gap-2 glass-input rounded-full pr-4 pl-1 py-1 border-white/40">
                <img src={user.imageUrl} alt="Profile" className="w-7 h-7 rounded-full" />
                <span className="text-xs font-medium">{user.givenName}</span>
                
                {/* <-- NEW BACKUP BUTTON --> */}
                <button onClick={handleBackup} className="text-xs text-success hover:text-success/80 ml-2 font-bold px-2 border-l border-white/20">
                  Backup
                </button>

                {/* <-- NEW RESTORE BUTTON --> */}
                <button onClick={handleRestore} className="text-xs text-blue-400 hover:text-blue-300 font-bold px-2 border-l border-white/20">
                  Restore
                </button>
                
                <button onClick={signOut} className="text-xs text-muted-foreground hover:text-destructive ml-2 font-bold px-2 border-l border-white/20">
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="glass-input rounded-full px-4 py-2 text-xs font-medium border border-white/40 hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-3 h-3" />
                Sign in
              </button>
            )}

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

        <StatsPanel expenses={expenses} budget={budget} currency={currency} setBudget={setBudget} setCurrency={setCurrency} />
        <AddExpenseCard onAdd={addExpense} />

        <FiltersBar
          search={search} setSearch={setSearch}
          category={category} setCategory={setCategory}
          range={range} setRange={setRange}
          budget={budget} setBudget={setBudget}
          currency={currency} setCurrency={setCurrency}
          
          onExportCSV={(data) => {
            const refinedData = filterExpensesForExport(data);
            guard(() => exportCSV(refinedData, { 
              currency, 
              currencyCode, 
              title: data.title,
              exportRange: data.exportRange,
              customStart: data.customStart, 
              customEnd: data.customEnd 
            }))();
          }}
          onExportXLSX={(data) => {
            const refinedData = filterExpensesForExport(data);
            guard(() => exportXLSX(refinedData, { 
              currency, 
              currencyCode, 
              title: data.title,
              exportRange: data.exportRange,
              customStart: data.customStart, 
              customEnd: data.customEnd 
            }))();
          }}
          onExportPDF={(data) => {
            const refinedData = filterExpensesForExport(data);
            guard(() => exportPDF(refinedData, { 
              currency, 
              currencyCode, 
              title: data.title,
              exportRange: data.exportRange,
              customStart: data.customStart, 
              customEnd: data.customEnd 
            }))();
          }}
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