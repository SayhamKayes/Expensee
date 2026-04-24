import { useEffect, useState } from "react";
import { Mic, MicOff, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, Category, parseExpenseText } from "@/lib/expenses";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  onAdd: (e: { amount: number; purpose: string; category: Category; recurring: false | "monthly" | "weekly"; date: string }) => void;
};

export function AddExpenseCard({ onAdd }: Props) {
  const [raw, setRaw] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [recurring, setRecurring] = useState<"no" | "monthly" | "weekly">("no");

  const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const { listening, supported, interim, start, stop } = useVoiceInput(
    (text) => {
      // Final chunk logic
      setRaw((prev) => {
        // Fix: If mobile (single sentence), replace the text. 
        // If web (continuous listening), append the new chunks.
        const newText = isMobile ? text : (prev ? prev.trim() + " " : "") + text;
        
        // We don't need to manually parse here because setting `raw` 
        // will automatically trigger your `useEffect` right below this!
        return newText; 
      });
      toast.success("Voice captured");
    },
    {
      continuous: !isMobile, 
      onInterim: (text) => {
        setRaw(text);
      },
    }
  );

  // Auto-parse as user types in the smart bar
  useEffect(() => {
    if (!raw) return;
    const parsed = parseExpenseText(raw);
    if (parsed.amount != null) setAmount(String(parsed.amount));
    if (parsed.purpose) setPurpose(parsed.purpose);
    setCategory(parsed.category);
  }, [raw]);

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!purpose.trim()) return toast.error("Enter what it was for");
    onAdd({
      amount: amt,
      purpose: purpose.trim(),
      category,
      recurring: recurring === "no" ? false : recurring,
      date: new Date().toISOString(),
    });
    setRaw(""); setAmount(""); setPurpose(""); setCategory("Other"); setRecurring("no");
    toast.success("Expense added");
  };

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-elevated">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Add expense</h2>
        <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
          Try: "12 dollars for coffee" or type freely
        </span>
      </div>

      {/* Smart input + voice */}
      <div className="flex gap-2 mb-4">
        <Input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={interim || 'e.g. "fifteen bucks lunch" or "$45 uber"'}
          className="glass-input h-14 text-base rounded-2xl border-white/40"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button
          type="button"
          onClick={() => (listening ? stop() : start())}
          disabled={!supported}
          title={supported ? "Hold a thought, speak naturally" : "Voice not supported in this browser"}
          className={cn(
            "h-14 w-14 rounded-2xl shrink-0 shadow-glass border border-white/50",
            listening
              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground mic-active"
              : "bg-gradient-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
      </div>

      {/* Parsed fields */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="glass-input rounded-xl md:col-span-3 border-white/40"
        />
        <Input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Purpose"
          className="glass-input rounded-xl md:col-span-4 border-white/40"
        />
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger className="glass-input rounded-xl md:col-span-2 border-white/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/40 rounded-xl">
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={recurring} onValueChange={(v) => setRecurring(v as any)}>
          <SelectTrigger className="glass-input rounded-xl md:col-span-2 border-white/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/40 rounded-xl">
            <SelectItem value="no">One-time</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={submit}
          className="md:col-span-1 h-10 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {listening && (
        <p className="mt-3 text-sm text-muted-foreground italic">Listening… {interim}</p>
      )}
      {!supported && (
        <p className="mt-3 text-xs text-warning">Voice input isn't supported here. Try Chrome, Edge, or Safari.</p>
      )}
    </div>
  );
}
