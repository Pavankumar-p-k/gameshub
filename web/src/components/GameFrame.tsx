import type { ReactNode } from "react";

interface GameFrameProps {
  title: string;
  subtitle: string;
  status?: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function GameFrame({ title, subtitle, status, actions, children, footer }: GameFrameProps) {
  return (
    <div className="glass-panel rounded-3xl p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="brand-title text-2xl text-[var(--text-primary)] md:text-3xl">{title}</h1>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
          {status ? <p className="chip">{status}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <section className="mt-5">{children}</section>
      {footer ? <footer className="mt-5 text-sm text-[var(--text-muted)]">{footer}</footer> : null}
    </div>
  );
}
