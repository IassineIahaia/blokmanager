"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext } from "react";
import { signOut } from "next-auth/react";
import {
  ExternalLink,
  Factory,
  LayoutGrid,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminUser {
  name: string;
  email: string;
}

const AdminUserContext = createContext<AdminUser | null>(null);

export function AdminUserProvider({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  return <AdminUserContext.Provider value={user}>{children}</AdminUserContext.Provider>;
}

export function useAdminUser() {
  return useContext(AdminUserContext);
}

export function logout() {
  return signOut({ redirectTo: "/login" });
}

const navItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutGrid },
  { href: "/encomendas", label: "Encomendas", icon: ShoppingBag },
  { href: "/producao", label: "Produção", icon: Factory },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/trabalhadores", label: "Equipa", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ pendingVerification = 0 }: { pendingVerification?: number }) {
  const pathname = usePathname();
  const user = useAdminUser();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-on-primary">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <rect x="2" y="5" width="9" height="6" rx="1" />
            <rect x="13" y="5" width="9" height="6" rx="1" />
            <rect x="7" y="13" width="10" height="6" rx="1" />
          </svg>
        </span>
        <div>
          <p className="font-semibold leading-tight text-on-surface">BlokManager</p>
          <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Administração</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-container/30 text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-low",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/encomendas" && pendingVerification > 0 && (
                <span
                  className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-on-secondary"
                  title="Pagamentos por verificar"
                >
                  {pendingVerification}
                </span>
              )}
            </Link>
          );
        })}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
        >
          <ExternalLink className="h-5 w-5" /> Ver loja
        </Link>
      </nav>

      {user && (
        <div className="m-3 flex items-center gap-3 rounded-md border border-outline-variant p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-container text-[13px] font-semibold text-on-primary-container">
            {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-medium text-on-surface">{user.name}</p>
            <p className="truncate text-[12px] text-on-surface-variant">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error"
            aria-label="Terminar sessão"
            title="Terminar sessão"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}

export function AdminBottomNav({ pendingVerification = 0 }: { pendingVerification?: number }) {
  const pathname = usePathname();
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-outline-variant bg-surface-container-lowest md:hidden print:hidden">
      {mobileItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
              isActive ? "text-primary" : "text-on-surface-variant",
            )}
          >
            <span className={cn("rounded-full px-4 py-1", isActive && "bg-primary-container/30")}>
              <Icon className="h-5 w-5" />
            </span>
            {item.label}
            {item.href === "/encomendas" && pendingVerification > 0 && (
              <span className="absolute right-[22%] top-1 h-2.5 w-2.5 rounded-full bg-secondary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
