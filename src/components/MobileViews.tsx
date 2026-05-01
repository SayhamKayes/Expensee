import { Expense, formatMoney, CATEGORY_COLORS, Category, CATEGORIES } from "@/lib/expenses";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { format, startOfMonth, isAfter, subDays, eachDayOfInterval, startOfYear, eachMonthOfInterval, startOfDay, endOfDay } from "date-fns";
import { useState, useMemo } from "react";
import { Pencil, Check, X, Cloud } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CommonProps = {
  expenses: Expense[];
  currency: string;
};

/* -------- Dashboard tab: budget summary card -------- */
export function MobileDashboard({
  expenses,
  budget,
  currency,
  setBudget,
  user,
  signIn,
  signOut,
  handleBackup,
  handleRestore,
  setCurrency,
}: CommonProps & { 
  budget: number; 
  setBudget: (n: number) => void;
  user?: any;
  signIn?: () => void;
  signOut?: () => void;
  handleBackup?: () => void;
  handleRestore?: () => void;
  setCurrency: (c: string) => void;
}) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthExpenses = expenses.filter((e) => isAfter(new Date(e.date), monthStart));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const allTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = budget > 0 ? Math.min(100, (monthTotal / budget) * 100) : 0;
  const overBudget = monthTotal > budget && budget > 0;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(budget.toString());

  const commit = () => {
    const n = Number(draft);
    if (!isNaN(n) && n >= 0) setBudget(n);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-3xl p-5 shadow-glass">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">This month</p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <p className="text-3xl font-bold tabular-nums text-gradient">
            {formatMoney(monthTotal, currency)}
          </p>
          
          {/* <-- NEW WRAPPER FOR CURRENCY & BUDGET --> */}
          <div className="flex items-center gap-2 ml-auto">
            
            {/* NEW CURRENCY DROPDOWN */}
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 glass-input rounded-xl border-white/40 text-[11px] font-medium px-2 shadow-none w-[85px] focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/40 rounded-xl">
                <SelectItem value="$">USD ($)</SelectItem>
                <SelectItem value="€">EUR (€)</SelectItem>
                <SelectItem value="£">GBP (£)</SelectItem>
                <SelectItem value="₹">INR (₹)</SelectItem>
                <SelectItem value="¥">JPY (¥)</SelectItem>
                <SelectItem value="A$">AUD (A$)</SelectItem>
                <SelectItem value="C$">CAD (C$)</SelectItem>
                <SelectItem value="R$">BRL (R$)</SelectItem>
                <SelectItem value="Mex$">MXN (Mex$)</SelectItem>
                <SelectItem value="د.إ">AED (د.إ)</SelectItem>
                <SelectItem value="৳">BDT (৳)</SelectItem>
              </SelectContent>
            </Select>

            {/* EXISTING BUDGET PILL */}
            <div className="flex items-center gap-1.5 glass-input rounded-xl px-2 h-8 border border-white/40">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Budget</span>
              <span className="text-xs text-muted-foreground">{currency}</span>
              {editing ? (
                <>
                  <input
                    type="number"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit();
                      if (e.key === "Escape") setEditing(false);
                    }}
                    className="bg-transparent w-16 text-xs font-medium outline-none tabular-nums"
                  />
                  <button onClick={commit} className="text-success" aria-label="Save"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditing(false)} className="text-muted-foreground" aria-label="Cancel"><X className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium tabular-nums">{budget.toLocaleString()}</span>
                  <button onClick={() => { setDraft(budget.toString()); setEditing(true); }} className="text-muted-foreground" aria-label="Edit budget">
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">of {formatMoney(budget, currency)} budget</p>
        <div className="mt-3 h-2.5 rounded-full bg-white/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: overBudget ? "hsl(var(--destructive))" : "var(--gradient-primary)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px]">
          <span className={overBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            {pct.toFixed(0)}% used
          </span>
          <span className="text-muted-foreground">{monthExpenses.length} entries</span>
        </div>
        <div className="mt-4 pt-4 border-t border-white/40 flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-[11px]">All time</p>
            <p className="font-semibold">{formatMoney(allTotal, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-[11px]">Total entries</p>
            <p className="font-semibold">{expenses.length}</p>
          </div>
        </div>
      </div>

      {/* <-- NEW MOBILE AUTH & SYNC CARD --> */}
      <div className="glass-strong rounded-3xl p-4 flex items-center justify-between shadow-glass">
         {user ? (
            <div className="flex items-center gap-3 w-full">
              <img src={user.imageUrl} alt="Profile" className="w-9 h-9 rounded-full border border-white/20" />
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold tracking-tight truncate">{user.givenName}</p>
                 <div className="flex gap-3 mt-1">
                   <button onClick={handleBackup} className="text-[10px] font-bold text-success uppercase tracking-wider hover:opacity-70">Backup</button>
                   <button onClick={handleRestore} className="text-[10px] font-bold text-blue-400 uppercase tracking-wider hover:opacity-70">Restore</button>
                 </div>
              </div>
              <button onClick={signOut} className="text-[10px] font-bold text-muted-foreground hover:text-destructive uppercase tracking-wider bg-white/5 px-2 py-1.5 rounded-lg border border-white/10">
                Logout
              </button>
            </div>
         ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <Cloud className="w-4 h-4 text-white" />
                 </div>
                 <div>
                    <p className="text-sm font-bold tracking-tight">Cloud Sync</p>
                    <p className="text-[10px] text-muted-foreground">Save data to Google Drive</p>
                 </div>
              </div>
              <button onClick={signIn} className="glass-input rounded-2xl px-4 py-2 text-xs font-medium border border-white/40 flex items-center gap-2 bg-white/5 active:bg-white/10 transition-all">
                 <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-3.5 h-3.5" />
                 Sign in
              </button>
            </div>
         )}
      </div>
    </div>
  );
}

/* -------- Categories tab: Dynamic Pie Chart -------- */
export function MobileCategories({ expenses, currency }: CommonProps) {
  const [categoryRange, setCategoryRange] = useState<"month" | "year" | "all" | "custom">("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const pieExpenses = useMemo(() => {
    const n = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (categoryRange === "month") return isAfter(d, startOfMonth(n)) || d.getTime() === startOfMonth(n).getTime();
      if (categoryRange === "year") return isAfter(d, startOfYear(n)) || d.getTime() === startOfYear(n).getTime();
      if (categoryRange === "custom" && customStart && customEnd) {
        const s = startOfDay(new Date(customStart));
        const e = endOfDay(new Date(customEnd));
        return d >= s && d <= e;
      }
      if (categoryRange === "custom") return false; 
      return true; // "all"
    });
  }, [expenses, categoryRange, customStart, customEnd]);

  const byCat = CATEGORIES.map(cat => ({
    name: cat,
    value: pieExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-4 pb-20">
      <div className="glass-strong rounded-3xl p-5 shadow-glass">
        
        {/* HEADER WITH DROPDOWN */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Category Breakdown</p>
          <Select value={categoryRange} onValueChange={(v: any) => setCategoryRange(v)}>
            <SelectTrigger className="h-7 text-[10px] glass-input rounded-lg border-white/40 px-2 w-[110px] shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-white/40 rounded-xl">
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CUSTOM DATE PICKERS */}
        {categoryRange === "custom" && (
          <div className="flex items-center gap-2 mb-4 animate-in fade-in zoom-in duration-200">
            <input 
              type="date" 
              value={customStart} 
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full h-8 text-xs glass-input rounded-lg border-white/40 px-2 outline-none"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full h-8 text-xs glass-input rounded-lg border-white/40 px-2 outline-none"
            />
          </div>
        )}

        <div className="h-56 mb-4">
          {byCat.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {byCat.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name as Category]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12 }} formatter={(v: number) => formatMoney(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center">
              {categoryRange === "custom" && (!customStart || !customEnd) ? "Select dates to view data" : "No data for this range"}
            </div>
          )}
        </div>
        <div className="space-y-2">
          {byCat.sort((a, b) => b.value - a.value).map(d => (
            <div key={d.name} className="flex items-center justify-between p-3 rounded-2xl glass-input border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[d.name as Category] }} />
                <span className="text-sm font-medium">{d.name}</span>
              </div>
              <span className="font-semibold text-sm">{formatMoney(d.value, currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------- Graph tab: dynamic trend line -------- */
export function MobileGraph({ expenses, currency }: CommonProps) {
  const [graphRange, setGraphRange] = useState<"14d" | "month" | "year" | "all">("14d");

  const trend = useMemo(() => {
    const now = new Date();
    if (graphRange === "14d") {
      return eachDayOfInterval({ start: subDays(now, 13), end: now }).map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const total = expenses.filter((e) => format(new Date(e.date), "yyyy-MM-dd") === key).reduce((s, e) => s + e.amount, 0);
        return { label: format(d, "MMM d"), amount: Number(total.toFixed(2)) };
      });
    }
    if (graphRange === "month") {
      return eachDayOfInterval({ start: startOfMonth(now), end: now }).map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const total = expenses.filter((e) => format(new Date(e.date), "yyyy-MM-dd") === key).reduce((s, e) => s + e.amount, 0);
        return { label: format(d, "MMM d"), amount: Number(total.toFixed(2)) };
      });
    }
    if (graphRange === "year") {
      return eachMonthOfInterval({ start: startOfYear(now), end: now }).map((d) => {
        const key = format(d, "yyyy-MM");
        const total = expenses.filter((e) => format(new Date(e.date), "yyyy-MM") === key).reduce((s, e) => s + e.amount, 0);
        return { label: format(d, "MMM"), amount: Number(total.toFixed(2)) };
      });
    }
    // "all"
    const minDate = expenses.length > 0 ? new Date(Math.min(...expenses.map((e) => new Date(e.date).getTime()))) : now;
    return eachMonthOfInterval({ start: minDate, end: now }).map((d) => {
      const key = format(d, "yyyy-MM");
      const total = expenses.filter((e) => format(new Date(e.date), "yyyy-MM") === key).reduce((s, e) => s + e.amount, 0);
      return { label: format(d, "MMM yy"), amount: Number(total.toFixed(2)) };
    });
  }, [expenses, graphRange]);

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-3xl p-5 shadow-glass">
        
        {/* HEADER WITH DROPDOWN */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expense Trend</p>
          <Select value={graphRange} onValueChange={(v: any) => setGraphRange(v)}>
            <SelectTrigger className="h-7 text-[10px] glass-input rounded-lg border-white/40 px-2 w-[110px] shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-white/40 rounded-xl">
              <SelectItem value="14d">Last 14 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: -20, right: 10, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 80%)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12 }}
                formatter={(v: number) => formatMoney(v, currency)}
              />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}