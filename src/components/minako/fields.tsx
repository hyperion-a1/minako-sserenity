import { useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, Hash, Megaphone, Minus, Plus, X, Folder, MessagesSquare, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { scrollToPending, sectionKey, setCollapsed, slugify, useCollapsed } from "@/lib/minako/sections";

import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DemoChannel, ModuleId } from "@/lib/minako/config";
import { useDashboard } from "@/lib/minako/store";
import { cn } from "@/lib/utils";

import { burstFrom } from "./effects";
import { playSound } from "./use-sound";

/* ---------- Estrutura ---------- */

export function SectionCard({
  title,
  description,
  icon: Icon,
  tone = "bg-secondary text-secondary-foreground",
  children,
  className,
  delay = 0,
}: {
  title: string;
  description?: string | undefined;
  icon?: LucideIcon | undefined;
  tone?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
  delay?: number | undefined;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const slug = slugify(title);
  const key = sectionKey(pathname, slug);
  const collapsed = useCollapsed(key);
  const bodyId = useId();
  useEffect(() => {
    scrollToPending(pathname);
  }, [pathname]);
  return (
    <section
      id={`secao-${slug}`}
      className={cn("squish-card animate-rise scroll-mt-24 p-4 sm:p-6", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-controls={bodyId}
        onClick={() => {
          playSound("tick");
          setCollapsed(key, !collapsed);
        }}
        className={cn("flex w-full items-start gap-3 text-left", !collapsed && "mb-5")}
      >
        {Icon && (
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", tone)}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          {description && !collapsed && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          {collapsed && <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Recolhida · toque para abrir</p>}
        </div>
        <ChevronDown
          aria-hidden
          className={cn("mt-2 h-5 w-5 shrink-0 text-muted-foreground transition-transform", collapsed ? "-rotate-90" : "")}
        />
        <span className="sr-only">{collapsed ? "Abrir seção" : "Recolher seção"}</span>
      </button>
      {!collapsed && (
        <div id={bodyId} className="space-y-5">
          {children}
        </div>
      )}
    </section>
  );
}

export function useFieldError(module: ModuleId, field: string) {
  const { issues } = useDashboard();
  return issues.find((i) => i.module === module && i.field === field)?.message;
}

export function FieldShell({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block font-display text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p className="animate-pop-in text-xs font-semibold text-destructive">🥺 {error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-[inset_0_2px_0_0_var(--color-muted)] outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted-foreground focus:border-ring focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ring)_25%,transparent)]";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  maxLength?: number | undefined;
}) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <input
        id={id}
        className={cn(inputBase, error && "border-destructive")}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function DateTimeField({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string | undefined;
  error?: string | undefined;
}) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <input
        id={id}
        type="datetime-local"
        className={cn(inputBase, error && "border-destructive")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  error,
  rows = 4,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string | undefined;
  error?: string | undefined;
  rows?: number | undefined;
  maxLength?: number | undefined;
}) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        className={cn(inputBase, "resize-y leading-relaxed", error && "border-destructive")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string | undefined;
  error?: string | undefined;
}) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <input
        id={id}
        type="time"
        className={cn(inputBase, "font-display text-lg tabular-nums", error && "border-destructive")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  suffix,
  hint,
  error,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  suffix?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}) {
  const id = useId();
  const bump = (d: number) => {
    const next = Math.min(max, Math.max(min, (Number.isFinite(value) ? value : 0) + d));
    if (next !== value) playSound("tick");
    onChange(next);
  };
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <div
        className={cn(
          "flex items-center gap-1 rounded-2xl border-2 border-input bg-background p-1",
          error && "border-destructive",
        )}
      >
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          onClick={() => bump(-step)}
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground transition-transform active:scale-90"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className="w-full min-w-0 bg-transparent text-center font-display text-lg font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-1 text-xs font-semibold text-muted-foreground">{suffix}</span>}
        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          onClick={() => bump(step)}
          className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </FieldShell>
  );
}

/* ---------- Interruptores ---------- */

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  emoji,
  big,
}: {
  label: string;
  hint?: string | undefined;
  checked: boolean;
  onChange: (v: boolean) => void;
  emoji?: string | undefined;
  big?: boolean | undefined;
}) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors duration-300",
        checked ? "border-primary/60 bg-secondary/70" : "border-border bg-background",
      )}
    >
      {emoji && (
        <span className={cn("shrink-0 text-2xl transition-transform", checked && "animate-wiggle")}>
          {emoji}
        </span>
      )}
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className={cn("block font-display font-semibold", big ? "text-base" : "text-sm")}>
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </label>
      <Switch
        id={id}
        ref={ref}
        checked={checked}
        onCheckedChange={(v) => {
          playSound(v ? "on" : "off");
          if (v) burstFrom(ref.current, 8);
          onChange(v);
        }}
      />
    </div>
  );
}

/* ---------- Escolha segmentada ---------- */

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label?: string | undefined;
  options: { value: T; label: string; emoji?: string }[];
  value: T;
  onChange: (v: T) => void;
  hint?: string | undefined;
}) {
  const content = (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (!active) playSound("pop");
              onChange(o.value);
            }}
            className={cn(
              "rounded-full border-2 px-4 py-2 font-display text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              active
                ? "-translate-y-0.5 border-primary-deep bg-primary text-primary-foreground shadow-[var(--shadow-squish-primary)]"
                : "border-border bg-background text-muted-foreground hover:-translate-y-0.5 hover:text-foreground",
            )}
          >
            {o.emoji && <span className="mr-1">{o.emoji}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
  if (!label) return content;
  return (
    <FieldShell label={label} hint={hint}>
      {content}
    </FieldShell>
  );
}

/* ---------- Seletores de canais e cargos ---------- */

const CHANNEL_ICON: Record<DemoChannel["kind"], LucideIcon> = {
  text: Hash,
  announcement: Megaphone,
  forum: MessagesSquare,
  category: Folder,
};

interface PickerProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean | undefined;
  placeholder?: string | undefined;
}

function Picker({
  label,
  hint,
  error,
  value,
  onChange,
  multiple = true,
  placeholder,
  items,
  renderChip,
  renderOption,
  searchPlaceholder,
}: PickerProps & {
  items: { id: string; name: string }[];
  renderChip: (id: string) => ReactNode;
  renderOption: (item: { id: string; name: string }) => ReactNode;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => {
    if (multiple) {
      const has = value.includes(id);
      playSound(has ? "off" : "pop");
      onChange(has ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      playSound("pop");
      onChange(value[0] === id ? [] : [id]);
      setOpen(false);
    }
  };
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <div
        className={cn(
          "flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-border-strong/70 bg-background/70 p-2",
          error && "border-destructive",
        )}
      >
        {value.map((id) => (
          <span
            key={id}
            className="inline-flex animate-pop-in items-center gap-1.5 rounded-full border-2 border-border bg-card py-1 pl-2.5 pr-1 text-sm font-semibold shadow-squish-sm"
          >
            {renderChip(id)}
            <button
              type="button"
              onClick={() => toggle(id)}
              aria-label="Remover"
              className="grid h-5 w-5 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={() => playSound("tick")}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-display text-sm font-semibold text-secondary-foreground transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              {value.length === 0 ? (placeholder ?? "Escolher") : multiple ? "Adicionar" : "Trocar"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 rounded-2xl border-2 p-0" align="start">
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>Nada por aqui… 🥺</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => toggle(item.id)}
                      className="gap-2 rounded-xl"
                    >
                      {renderOption(item)}
                      {value.includes(item.id) && <Check className="ml-auto h-4 w-4 text-primary-deep" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </FieldShell>
  );
}

export function ChannelPicker({
  kinds = ["text", "announcement", "forum"],
  ...props
}: PickerProps & { kinds?: DemoChannel["kind"][] }) {
  const { guild } = useDashboard();
  const items = guild.channels.filter((c) => kinds.includes(c.kind));
  const byId = (id: string) => guild.channels.find((c) => c.id === id);
  return (
    <Picker
      {...props}
      items={items}
      searchPlaceholder={kinds.includes("category") && kinds.length === 1 ? "Buscar categoria…" : "Buscar canal…"}
      renderChip={(id) => {
        const ch = byId(id);
        const Icon = CHANNEL_ICON[ch?.kind ?? "text"];
        return (
          <>
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {ch?.name ?? "canal sumido"}
          </>
        );
      }}
      renderOption={(item) => {
        const ch = byId(item.id)!;
        const Icon = CHANNEL_ICON[ch.kind];
        return (
          <>
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{ch.name}</span>
          </>
        );
      }}
    />
  );
}

export function RolePicker(props: PickerProps) {
  const { guild } = useDashboard();
  const byId = (id: string) => guild.roles.find((r) => r.id === id);
  return (
    <Picker
      {...props}
      items={guild.roles}
      searchPlaceholder="Buscar cargo…"
      renderChip={(id) => {
        const r = byId(id);
        return (
          <>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r?.color }} />
            {r?.name ?? "cargo sumido"}
          </>
        );
      }}
      renderOption={(item) => (
        <>
          <span className="h-3 w-3 rounded-full" style={{ background: byId(item.id)?.color }} />
          <span className="font-semibold">{item.name}</span>
        </>
      )}
    />
  );
}

/** Ajuda para campos de escolha única guardados como string | null */
export const single = {
  toList: (v: string | null) => (v ? [v] : []),
  fromList: (l: string[]) => l[0] ?? null,
};

/* ---------- Balãozinho de dica da Minako ---------- */

export function MinakoTip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-primary/60 bg-secondary/60 px-4 py-3 text-sm">
      <span className="animate-heartbeat text-lg">🧡</span>
      <p className="text-secondary-foreground">{children}</p>
    </div>
  );
}
