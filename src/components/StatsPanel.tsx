import { useState } from "react";
import { Expense, formatMoney, CATEGORY_COLORS, Category, CATEGORIES } from "@/lib/expenses";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, startOfMonth, isAfter, subDays, eachDayOfInterval } from "date-fns";
import { Pencil, Check, X } from "lucide-react";

type Props = {
  expenses: Expense[];
  budget: number;
  currency: string;
  setBudget?: (n: number) => void;
};

export function StatsPanel({ expenses, budget, currency, setBudget }: Props) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthExpenses = expenses.filter(e => isAfter(new Date(e.date), monthStart));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const allTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = budget > 0 ? Math.min(100, (monthTotal / budget) * 100) : 0;
  const overBudget = monthTotal > budget && budget > 0;

  const [editingBudget, setEditingBudget] = useState(false);
  const [draftBudget, setDraftBudget] = useState(budget.toString());

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

  // Pie data by category (this month)
  const byCat = CATEGORIES.map(cat => ({
    name: cat,
    value: monthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.value > 0);

  // Line: last 14 days
  const days = eachDayOfInterval({ start: subDays(now, 13), end: now });
  const trend = days.map(d => {
    const key = format(d, "yyyy-MM-dd");
    const total = expenses
      .filter(e => format(new Date(e.date), "yyyy-MM-dd") === key)
      .reduce((s, e) => s + e.amount, 0);
    return { day: format(d, "MMM d"), amount: Number(total.toFixed(2)) };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Budget */}
      <div className="glass-strong rounded-3xl p-6 shadow-glass">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">This month</p>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <p className="text-4xl font-bold tabular-nums text-gradient">
            {formatMoney(monthTotal, currency)}
          </p>
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
                  <button onClick={commitBudget} className="text-success hover:opacity-80" aria-label="Save budget">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelBudget} className="text-muted-foreground hover:opacity-80" aria-label="Cancel">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium tabular-nums">{budget.toLocaleString()}</span>
                  <button onClick={startEdit} className="text-muted-foreground hover:text-foreground" aria-label="Edit budget">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          of {formatMoney(budget, currency)} budget
        </p>
        <div className="mt-4 h-3 rounded-full bg-white/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: overBudget
                ? "hsl(var(--destructive))"
                : "var(--gradient-primary)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className={overBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            {pct.toFixed(0)}% used
          </span>
          <span className="text-muted-foreground">
            {monthExpenses.length} entries
          </span>
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
      <div className="glass-strong rounded-3xl p-6 shadow-glass">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">By category</p>
        <div className="h-48">
          {byCat.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {byCat.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name as Category]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12, backdropFilter: "blur(10px)" }}
                  formatter={(v: number) => formatMoney(v, currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data this month</div>
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

      {/* Trend */}
      <div className="glass-strong rounded-3xl p-6 shadow-glass">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Last 14 days</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 80%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
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
