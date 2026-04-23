import { Expense, formatMoney, CATEGORY_COLORS } from "@/lib/expenses";
import { Trash2, Repeat } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type Props = {
  expenses: Expense[];
  currency: string;
  onRemove: (id: string) => void;
};

export function ExpenseList({ expenses, currency, onRemove }: Props) {
  if (!expenses.length) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <p className="text-muted-foreground">No expenses match your filters yet.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl overflow-hidden divide-y divide-white/30">
      {expenses.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-4 p-4 hover:bg-white/30 transition-colors group"
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-glass"
            style={{ background: CATEGORY_COLORS[e.category] }}
          >
            {e.category[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{e.purpose}</p>
              {e.recurring && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                  <Repeat className="w-3 h-3" /> {e.recurring}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {e.category} • {format(new Date(e.date), "MMM d, yyyy")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold tabular-nums">{formatMoney(e.amount, currency)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(e.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
