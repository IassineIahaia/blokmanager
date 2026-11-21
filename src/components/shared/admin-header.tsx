"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logout, useAdminUser } from "./admin-nav";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}

export function AdminHeader({ title, subtitle, actions, back }: AdminHeaderProps) {
  const user = useAdminUser();

  return (
    <header className="border-b border-outline-variant bg-surface-container-lowest px-4 py-4 md:px-8 print:hidden">
      {back && (
        <Link href={back.href} className="mb-1 inline-block text-body-sm text-on-surface-variant hover:text-primary">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-headline-mobile font-semibold text-on-surface md:text-headline-lg">{title}</h1>
          {subtitle && <p className="text-body-sm text-on-surface-variant">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {/* Em mobile não há sidebar: atalhos para configurações e sair */}
          {user && (
            <div className="flex items-center gap-1 md:hidden">
              <Link href="/configuracoes" className="rounded-md p-2 text-on-surface-variant" aria-label="Configurações">
                <Settings className="h-5 w-5" />
              </Link>
              <button onClick={logout} className="rounded-md p-2 text-on-surface-variant" aria-label="Terminar sessão">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
