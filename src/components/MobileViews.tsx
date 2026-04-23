import { Expense, formatMoney, CATEGORY_COLORS, Category, CATEGORIES } from "@/lib/expenses";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { format, startOfMonth, isAfter, subDays, eachDayOfInterval } from "date-fns";
import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

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
}: CommonProps & { budget: number; setBudget: (n: number) => void }) {
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
          <div className="flex items-center gap-1.5 glass-input rounded-xl px-2 h-8 border border-white/40 ml-auto">
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
    </div>
  );
}

/* -------- Categories tab: pie + per-category breakdown -------- */
export function MobileCategories({ expenses, currency }: CommonProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthExpenses = expenses.filter((e) => isAfter(new Date(e.date), monthStart));

  const byCat = CATEGORIES.map((cat) => ({
    name: cat,
    value: monthExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
    count: monthExpenses.filter((e) => e.category === cat).length,
  })).filter((d) => d.value > 0);

  const total = byCat.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-3xl p-5 shadow-glass">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">By category · this month</p>
        <div className="h-52">
          {byCat.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {byCat.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name as Category]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12 }}
                  formatter={(v: number) => formatMoney(v, currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data this month</div>
          )}
        </div>
      </div>

      <div className="glass rounded-3xl p-2 divide-y divide-white/30">
        {byCat.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Add an expense to see categories.</p>
        )}
        {byCat.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="p-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-glass"
                style={{ background: CATEGORY_COLORS[d.name as Category] }}
              >
                {d.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="font-semibold tabular-nums text-sm">{formatMoney(d.value, currency)}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORY_COLORS[d.name as Category] }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{d.count} entries</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Graph tab: trend line + 7d bar -------- */
export function MobileGraph({ expenses, currency }: CommonProps) {
  const now = new Date();
  const days14 = eachDayOfInterval({ start: subDays(now, 13), end: now });
  const trend = days14.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const total = expenses
      .filter((e) => format(new Date(e.date), "yyyy-MM-dd") === key)
      .reduce((s, e) => s + e.amount, 0);
    return { day: format(d, "MMM d"), short: format(d, "d"), amount: Number(total.toFixed(2)) };
  });

  const days7 = trend.slice(-7);

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-3xl p-5 shadow-glass">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Last 14 days · trend</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 80%)" />
              <XAxis dataKey="short" tick={{ fontSize: 10 }} interval={1} />
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

      <div className="glass-strong rounded-3xl p-5 shadow-glass">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Last 7 days</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days7} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 80%)" />
              <XAxis dataKey="short" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 12 }}
                formatter={(v: number) => formatMoney(v, currency)}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}