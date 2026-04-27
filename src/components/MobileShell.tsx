import { useState, ReactNode } from "react";
import { Wallet, LayoutDashboard, PieChart as PieIcon, LineChart as LineIcon, Plus, Info, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDarkMode } from "@/hooks/useDarkMode";

export type MobileTab = "dashboard" | "categories" | "graph" | "add";

type Props = {
  active: MobileTab;
  onChange: (t: MobileTab) => void;
  children: ReactNode;
};

const TABS: { id: MobileTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "categories", label: "Categories", icon: PieIcon },
  { id: "graph", label: "Graph", icon: LineIcon },
  { id: "add", label: "Add", icon: Plus },
];

export function MobileShell({ active, onChange, children }: Props) {
  const [open, setOpen] = useState(false);
  
  // <-- Initialize the dark mode hook
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="md:hidden flex flex-col min-h-screen">
      {/* Top glass bar */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-3">
        <div className="glass-strong rounded-3xl px-4 py-3 flex items-center justify-between shadow-glass">
          
          <div className="flex items-center gap-3">
            <div className="w-[55px] h-[20px] rounded-2xl flex items-center justify-center">
              <img src="../../Expensee_logo_final.png" alt="Expensee Logo"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Expensee</h1>
              <p className="text-xs text-muted-foreground">Record Expense | Track it | Export it.</p>
            </div>
          </div>

          {/* <-- Added Flex container to hold both buttons side-by-side --> */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="glass-input rounded-full w-9 h-9 flex items-center justify-center border border-white/40 hover:bg-white/20 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Storage Info Popover */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  aria-label="Storage info"
                  className="glass-input rounded-full w-9 h-9 flex items-center justify-center border border-white/40"
                >
                  <Info className="w-4 h-4 text-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="glass-strong border-white/40 rounded-2xl w-60 text-xs shadow-elevated">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="font-medium">All data saved locally</span>
                </div>
                <p className="text-muted-foreground">
                  Your expenses live on this device only. Nothing is sent to a server.
                </p>
              </PopoverContent>
            </Popover>
            
          </div>
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 px-4 pb-28 space-y-4">{children}</main>

      {/* Bottom glass nav */}
      <nav className="fixed bottom-4 inset-x-4 z-40">
        <div className="glass-strong rounded-3xl px-2 py-2 flex items-center justify-between shadow-glass border border-white/40">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-all",
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={t.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium leading-none">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}