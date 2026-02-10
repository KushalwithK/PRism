"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Grid3X3,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const lucentNavItems = [
  { label: "Applications", href: "/dashboard", icon: Grid3X3, exact: true },
  { label: "Dashboard", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

const prismNavItems = [
  { label: "Dashboard", href: "/dashboard/prism", icon: LayoutDashboard, exact: true },
  { label: "History", href: "/dashboard/prism/history", icon: History },
  { label: "Templates", href: "/dashboard/prism/templates", icon: FileText },
];

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const isPrismContext = pathname.startsWith("/dashboard/prism");
  const navItems = isPrismContext ? prismNavItems : lucentNavItems;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border/50 bg-card">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        {isPrismContext ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Lucent
            </Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="font-semibold text-foreground">PRism</span>
          </div>
        ) : (
          <Logo size="sm" />
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
