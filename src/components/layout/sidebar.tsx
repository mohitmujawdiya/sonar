"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Building2,
  PieChart,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/scan", label: "Scan", icon: Sparkles },
  { href: "/companies", label: "Deals", icon: Building2 },
  { href: "/funnel", label: "Conversion", icon: PieChart },
  { href: "/settings", label: "Thesis", icon: Compass },
];

const STORAGE_KEY = "sonar.sidebar.collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0 flex flex-col",
        mounted && "transition-[width] duration-200 ease-out",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div
        className={cn(
          "flex items-center h-[var(--topbar-h)] border-b border-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <Link href="/" className="flex flex-col leading-tight overflow-hidden">
            <span className="font-semibold text-lg tracking-tight">Sonar</span>
            <span className="text-xs text-muted-foreground">Founder evaluation</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md text-sm transition-colors",
                collapsed ? "justify-center h-9 w-full" : "px-3 py-1.5",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <ThemeToggle />
        </div>
      )}
    </aside>
  );
}
