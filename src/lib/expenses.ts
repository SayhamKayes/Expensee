export type Category =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Travel"
  | "Other";

export const CATEGORIES: Category[] = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Travel", "Other",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "hsl(25 90% 60%)",
  Transport: "hsl(200 95% 60%)",
  Shopping: "hsl(330 85% 65%)",
  Bills: "hsl(262 83% 60%)",
  Entertainment: "hsl(170 80% 50%)",
  Health: "hsl(0 80% 60%)",
  Travel: "hsl(45 95% 55%)",
  Other: "hsl(220 10% 55%)",
};

export type Expense = {
  id: string;
  amount: number;
  purpose: string;
  category: Category;
  date: string; // ISO
  recurring: false | "monthly" | "weekly";
};

export type AppState = {
  expenses: Expense[];
  budget: number;
  currency: string;
};

const STORAGE_KEY = "lumen-expenses-v1";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { expenses: [], budget: 1000, currency: "$" };
}

export function saveState(s: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ---------- Voice / text parsing ----------

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
};

function wordsToNumber(text: string): number | null {
  const tokens = text.toLowerCase().split(/[\s-]+/).filter(t => t in NUMBER_WORDS);
  if (!tokens.length) return null;
  let total = 0, current = 0;
  for (const t of tokens) {
    const n = NUMBER_WORDS[t];
    if (n === 100 || n === 1000) {
      current = (current || 1) * n;
    } else {
      current += n;
    }
  }
  total += current;
  return total || null;
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Food: ["food", "lunch", "dinner", "breakfast", "coffee", "restaurant", "groceries", "grocery", "snack", "meal", "pizza", "burger"],
  Transport: ["uber", "lyft", "taxi", "gas", "fuel", "bus", "train", "metro", "parking", "transport"],
  Shopping: ["shopping", "clothes", "amazon", "shoes", "shirt", "store"],
  Bills: ["bill", "rent", "electric", "electricity", "water", "internet", "phone", "subscription", "netflix", "spotify"],
  Entertainment: ["movie", "cinema", "game", "concert", "entertainment", "show"],
  Health: ["doctor", "pharmacy", "medicine", "gym", "health", "hospital", "dentist"],
  Travel: ["flight", "hotel", "airbnb", "trip", "travel", "vacation"],
  Other: [],
};

function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const cat of CATEGORIES) {
    if (CATEGORY_KEYWORDS[cat].some(k => lower.includes(k))) return cat;
  }
  return "Other";
}

export type ParsedExpense = { amount: number | null; purpose: string; category: Category };

export function parseExpenseText(input: string): ParsedExpense {
  const text = input.trim();
  if (!text) return { amount: null, purpose: "", category: "Other" };

  // Find numeric amount: $12, 12.50, "12 dollars", "12 bucks"
  let amount: number | null = null;
  const numMatch = text.match(/\$?\s*(\d+(?:[.,]\d{1,2})?)/);
  if (numMatch) {
    amount = parseFloat(numMatch[1].replace(",", "."));
  } else {
    amount = wordsToNumber(text);
  }

  // Purpose: strip the amount + filler words
  let purpose = text
    .replace(/\$?\s*\d+(?:[.,]\d{1,2})?\s*(dollars?|bucks?|usd|eur|euros?|pounds?|rs|rupees?)?/i, "")
    .replace(/\b(for|on|spent|paid|bought|i|me|today|yesterday)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!purpose) purpose = text;
  // Capitalize
  purpose = purpose.charAt(0).toUpperCase() + purpose.slice(1);

  return { amount, purpose, category: detectCategory(text) };
}

export function formatMoney(n: number, currency = "$") {
  return `${currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
