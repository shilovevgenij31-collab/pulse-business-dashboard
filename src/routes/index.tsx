import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/dashboard/TopNav";
import { Hero } from "@/components/dashboard/Hero";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AiInsight } from "@/components/dashboard/AiInsight";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import { CsvTable } from "@/components/dashboard/CsvTable";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
        <Hero />
        <KpiCards />

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <RevenueChart />
          <div className="flex flex-col gap-6">
            <AiInsight />
            <NeedsAttention />
          </div>
        </section>

        <SecondaryCharts />
        <CsvTable />

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Portfolio Pulse · v1.0
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>Claude insight ready</span>
            <span>·</span>
            <span>Last synced 2 min ago</span>
            <span>·</span>
            <span>Server-side API route</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
