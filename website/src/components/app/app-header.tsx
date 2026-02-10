"use client";

interface AppHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  backHref?: string;
}

export function AppHeader({ title, description, children, backHref }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 px-8 py-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <a
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </a>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
