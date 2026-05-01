import { useState, useMemo } from "react";
import { Expense, formatMoney, CATEGORY_COLORS, Category, CATEGORIES } from "@/lib/expenses";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
// Added startOfYear and eachMonthOfInterval for the new filters!
import { format, startOfMonth, isAfter, subDays, eachDayOfInterval, startOfYear, eachMonthOfInterval, startOfDay, endOfDay } from "date-fns";
import { Pencil, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  expenses: Expense[];
  budget: number;
  currency: string;
  setBudget?: (n: number) => void;
  setCurrency: (c: string) => void;
};

export function StatsPanel({ expenses, budget, currency, setBudget, setCurrency }: Props) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthExpenses = expenses.filter(e => isAfter(new Date(e.date), monthStart));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const allTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = budget > 0 ? Math.min(100, (monthTotal / budget) * 100) : 0;
  const overBudget = monthTotal > budget && budget > 0;

  const [editingBudget, setEditingBudget] = useState(false);
  const [draftBudget, setDraftBudget] = useState(budget.toString());
  
  // <-- NEW STATE FOR GRAPH FILTER -->
  const [graphRange, setGraphRange] = useState<"14d" | "month" | "year" | "all">("14d");

  // <-- NEW STATE FOR CATEGORY PIE CHART FILTER -->
  const [categoryRange, setCategoryRange] = useState<"month" | "year" | "all" | "custom">("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const startEdit = () => {
    setDraftBudget(budget.toString());
    setEditingBudget(true);
  };
  const commitBudget = () => {
    const n = Number(draftBudget);
    if (!isNaN(n) && n >= 0 && setBudget) setBudget(n);
    setEditingBudget(false);
  };
  const cancelBudget = () => setEditingBudget(false);

  // <-- DYNAMIC PIE CHART LOGIC -->
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
      if (categoryRange === "custom") return false; // Hide data until both dates are picked
      return true; // "all"
    });
  }, [expenses, categoryRange, customStart, customEnd]);

  const byCat = CATEGORIES.map(cat => ({
    name: cat,
    value: pieExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.value > 0);

  // <-- DYNAMIC GRAPH LOGIC -->
  const trend = useMemo(() => {
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
      return { label: format(d, "MMM yyyy"), amount: Number(total.toFixed(2)) };
    });
  }, [expenses, graphRange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Budget */}
      <div className="glass-strong rounded-3xl p-6 shadow-glass">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">This month</p>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <p className="text-4xl font-bold tabular-nums text-gradient">
            {formatMoney(monthTotal, currency)}
          </p>
          
          <div className="flex items-center gap-2 ml-auto">
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

            {setBudget && (
              <div className="flex items-center gap-1.5 glass-input rounded-xl px-2.5 h-9 border border-white/40">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</span>
                <span className="text-xs text-muted-foreground">{currency}</span>
                {editingBudget ? (
                  <>
                    <input
                      type="number"
                      autoFocus
                      value={draftBudget}
                      onChange={(e) => setDraftBudget(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitBudget();
                        if (e.key === "Escape") cancelBudget();
                      }}
                      className="bg-transparent w-20 text-sm font-medium outline-none tabular-nums"
                    />
                    <button onClick={commitBudget} className="text-success hover:opacity-80"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelBudget} className="text-muted-foreground hover:opacity-80"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium tabular-nums">{budget.toLocaleString()}</span>
                    <button onClick={startEdit} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">of {formatMoney(budget, currency)} budget</p>
        <div className="mt-4 h-3 rounded-full bg-white/40 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: overBudget ? "hsl(var(--destructive))" : "var(--gradient-primary)" }} />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className={overBudget ? "text-destructive font-medium" : "text-muted-foreground"}>{pct.toFixed(0)}% used</span>
          <span className="text-muted-foreground">{monthExpenses.length} entries</span>
        </div>
        <div className="mt-5 pt-5 border-t border-white/40 flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs">All time</p>
            <p className="font-semibold">{formatMoney(allTotal, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Total entries</p>
            <p className="font-semibold">{expenses.length}</p>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="glass-strong rounded-3xl p-6 shadow-glass flex flex-col">
        {/* HEADER WITH DROPDOWN */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">By category</p>
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

        {/* CUSTOM DATE PICKERS (Only shows if "Custom" is selected) */}
        {categoryRange === "custom" && (
          <div className="flex items-center gap-2 mb-2 animate-in fade-in zoom-in duration-200">
            <input 
              type="date" 
              value={customStart} 
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full h-7 text-[10px] glass-input rounded-lg border-white/40 px-2 outline-none"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full h-7 text-[10px] glass-input rounded-lg border-white/40 px-2 outline-none"
            />
          </div>
        )}

        <div className="flex-1 min-h-[192px]">
          {byCat.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {byCat.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name as Category]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, backdropFilter: "blur(10px)" }} formatter={(v: number) => formatMoney(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center">
              {categoryRange === "custom" && (!customStart || !customEnd) ? "Select a start and end date" : "No data for this range"}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {byCat.slice(0, 4).map(d => (
            <span key={d.name} className="inline-flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[d.name as Category] }} />
              {d.name}
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic Trend Graph */}
      <div className="glass-strong rounded-3xl p-6 shadow-glass flex flex-col">
        {/* <-- GRAPH HEADER WITH DROPDOWN --> */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Trend</p>
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

        <div className="flex-1 min-h-[192px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, bottom: 5, left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 80%)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12 }} formatter={(v: number) => formatMoney(v, currency)} />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}