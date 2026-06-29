"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, Factory } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/trabalhadores", label: "Trabalhadores", icon: Users },
  { href: "/producao", label: "Produção", icon: Factory },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-outline-variant bg-surface-container-lowest min-h-screen">
      <div className="px-6 py-6">
        <h1 className="text-title-md font-semibold text-on-surface">BlokManager</h1>
        <p className="text-label-caps text-on-surface-variant tracking-wide mt-1">
          MATERIALS MANAGEMENT
        </p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-outline-variant bg-surface-container-lowest flex items-stretch z-50">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-label-caps font-medium",
              isActive ? "text-primary" : "text-on-surface-variant"
            )}
          >
            <div
              className={cn(
                "rounded-md px-4 py-1",
                isActive && "bg-secondary-container text-on-secondary-container"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}