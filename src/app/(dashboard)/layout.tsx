"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { WeatherWidget } from "@/components/WeatherWidget";
import {
  Home,
  FlaskConical,
  Bug,
  CloudSun,
  MessageSquare,
  History,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/fertilizer", label: "Fertilizer Recommendation", icon: FlaskConical },
  { href: "/dashboard/deficiency", label: "Deficiency Detection", icon: Bug },
  { href: "/dashboard/weather", label: "Weather Advisory", icon: CloudSun },
  { href: "/dashboard/chatbot", label: "AI Chatbot", icon: MessageSquare },
  { href: "/dashboard/history", label: "History", icon: History },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-200 ease-in-out",
          "lg:static lg:translate-x-0 lg:shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-sidebar-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <FlaskConical className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-sidebar-foreground tracking-tight truncate">
              FertiSmart
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-2 shrink-0 p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Menu
          </p>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={[
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                ].join(" ")}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Weather + User footer */}
        <div className="shrink-0 border-t border-sidebar-border p-4 space-y-3">
          <WeatherWidget />
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 shrink-0 bg-card border-b border-border flex items-center justify-between px-5 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">
                {navLinks.find((l) => l.href === pathname)?.label ?? "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground">FertiSmart Platform</p>
            </div>
          </div>
          <UserButton />
        </header>

        {/* Page content — scrolls independently */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
