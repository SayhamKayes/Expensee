import { useCallback, useEffect, useState } from "react";
import { AppState, Expense, loadState, saveState } from "@/lib/expenses";

export function useExpenses() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => { saveState(state); }, [state]);

  const addExpense = useCallback((e: Omit<Expense, "id">) => {
    setState(s => ({ ...s, expenses: [{ ...e, id: crypto.randomUUID() }, ...s.expenses] }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setState(s => ({ ...s, expenses: s.expenses.filter(x => x.id !== id) }));
  }, []);

  const setBudget = useCallback((budget: number) => {
    setState(s => ({ ...s, budget }));
  }, []);

  const setCurrency = useCallback((currency: string) => {
    setState(s => ({ ...s, currency }));
  }, []);

  const clearAll = useCallback(() => {
    setState(s => ({ ...s, expenses: [] }));
  }, []);

  return { ...state, addExpense, removeExpense, setBudget, setCurrency, clearAll };
}
