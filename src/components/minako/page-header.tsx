import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { NavItem } from "./modules";

export function PageHeader({
  item,
  title,
  subtitle,
  aside,
}: {
  item: NavItem;
  title?: string | undefined;
  subtitle?: ReactNode | undefined;
  aside?: ReactNode | undefined;
}) {
  const Icon = item.icon;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 sm:mb-8">
      <span
        className={cn(
          "grid h-16 w-16 shrink-0 animate-pop-in place-items-center rounded-3xl border-2 border-card shadow-squish",
          item.tone,
        )}
      >
        <Icon className="h-8 w-8 animate-bob" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
          Configurações do servidor
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title ?? item.label}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}
