import { Expense, formatMoney, CATEGORY_COLORS } from "@/lib/expenses";
import { Trash2, Repeat, MoreVertical, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  expenses: Expense[];
  currency: string;
  onRemove: (id: string) => void;
  onEdit: (expense: Expense) => void; // Added onEdit prop
};

export function ExpenseList({ expenses, currency, onRemove, onEdit }: Props) {
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
          {/* Category Icon */}
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-glass"
            style={{ background: CATEGORY_COLORS[e.category] }}
          >
            {e.category[0]}
          </div>

          {/* Expense Details */}
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

          {/* Amount */}
          <div className="text-right">
            <p className="font-semibold tabular-nums">{formatMoney(e.amount, currency)}</p>
          </div>

          {/* 3-Dot Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-white/20 rounded-full h-8 w-8 ml-1"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-white/40 rounded-xl">
              <DropdownMenuItem 
                onClick={() => onEdit(e)}
                className="cursor-pointer gap-2"
              >
                <Pencil className="w-4 h-4 text-blue-500" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onRemove(e.id)}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      ))}
    </div>
  );
}