import { Activity, Bell, Search, ChevronDown } from "lucide-react";

const tabs = ["Overview", "Insights", "Metrics", "CSV Data", "Reports"];

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" strokeWidth={2.5} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-secondary ring-2 ring-background" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Portfolio Pulse</span>
            <span className="label-xs mt-0.5 text-[9px]">AI Analytics</span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/60 p-1 md:flex">
          {tabs.map((t) => {
            const active = t === "Overview";
            return (
              <button
                key={t}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--primary-glow)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="label-xs text-[10px] text-foreground">CSV Connected</span>
          </div>

          <button className="hidden items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium text-foreground hover:bg-card lg:flex">
            Last 12 months
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-xs font-bold text-background">
            AV
          </div>
        </div>
      </div>
    </header>
  );
}
