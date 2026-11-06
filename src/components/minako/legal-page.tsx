import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, type LucideIcon } from "lucide-react";
import { Fragment, useMemo, type ReactNode } from "react";

import { parseLegal, prettyTitle, type LegalBlock } from "@/lib/minako/legal";
import { cn } from "@/lib/utils";

import { playSound } from "./use-sound";

const LINK_RE = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+)/g;

function linkify(text: string): ReactNode {
  const parts = text.split(LINK_RE);
  return parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const clean = part.replace(/[.,;]+$/, "");
    const trail = part.slice(clean.length);
    const href = clean.includes("@") && !clean.startsWith("http") ? `mailto:${clean}` : clean;
    return (
      <Fragment key={i}>
        <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-primary-deep underline decoration-2 underline-offset-2">
          {clean}
        </a>
        {trail}
      </Fragment>
    );
  });
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "callout") {
    return (
      <div className="rounded-2xl border-2 border-ribbon/40 bg-accent px-4 py-3 text-accent-foreground">
        <strong className="font-display">Importante: </strong>
        {linkify(block.text)}
      </div>
    );
  }
  const label = block.label && (
    <span className="mr-1.5 inline-block rounded-md bg-secondary px-1.5 font-display text-xs font-semibold text-secondary-foreground">
      {block.label}
    </span>
  );
  if (block.type === "list") {
    return (
      <div>
        <p>
          {label}
          {linkify(block.intro)}
        </p>
        <ul className="mt-2 space-y-1.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 text-primary-deep">♥</span>
              <span>{linkify(it)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <p>
      {label}
      {linkify(block.text)}
    </p>
  );
}

export function LegalPage({
  raw,
  icon: Icon,
  tone,
  kicker,
  other,
}: {
  raw: string;
  icon: LucideIcon;
  tone: string;
  kicker: string;
  other: { to: "/termos" | "/privacidade"; label: string };
}) {
  const doc = useMemo(() => parseLegal(raw), [raw]);
  const title = (doc.title.split("—")[0] ?? doc.title).trim();

  return (
    <article id="topo" className="space-y-6">
      <Link
        to="/"
        onClick={() => playSound("nav")}
        className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <header className="squish-card relative overflow-hidden p-6 sm:p-8">
        <div className="dotted-paper absolute inset-0 opacity-40" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className={cn("grid h-16 w-16 place-items-center rounded-3xl", tone)}>
            <Icon className="h-8 w-8 animate-bob" />
          </span>
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">{kicker}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{prettyTitle(title)}</h1>
          </div>
        </div>
        <dl className="relative mt-6 grid gap-3 sm:grid-cols-2">
          {doc.meta.map((m) => (
            <div key={m.label} className="rounded-2xl bg-muted px-4 py-2.5">
              <dt className="text-xs font-semibold text-muted-foreground">{m.label}</dt>
              <dd className="break-words font-semibold">{linkify(m.value)}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Seções" className="lg:sticky lg:top-6 lg:self-start">
          <details className="squish-card group p-4 lg:open:block" open>
            <summary className="cursor-pointer list-none font-display font-semibold">📑 Seções</summary>
            <ol className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto text-sm">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => playSound("tick")}
                    className="flex gap-2 rounded-lg px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <span className="font-display font-semibold text-primary-deep">{s.number}.</span>
                    <span>{prettyTitle(s.title)}</span>
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </nav>

        <div className="space-y-4 leading-relaxed">
          {doc.intro.map((b, i) => (
            <Block key={i} block={b} />
          ))}
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="squish-card scroll-mt-40 p-5 sm:p-6 lg:scroll-mt-6">
              <h2 className="mb-4 flex items-baseline gap-2 text-xl font-bold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
                  {s.number}
                </span>
                {prettyTitle(s.title)}
              </h2>
              <div className="space-y-3 text-[15px]">
                {s.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </div>
            </section>
          ))}
          {doc.closing && (
            <p className="py-4 text-center font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              ✦ {doc.closing.toLocaleLowerCase("pt-BR")} ✦
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-3">
            <a href="#topo" className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowUp className="h-4 w-4" /> Voltar ao topo
            </a>
            <Link
              to={other.to}
              onClick={() => playSound("nav")}
              className="font-display text-sm font-semibold text-primary-deep hover:underline"
            >
              Ler também: {other.label} →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
