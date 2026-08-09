import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { applyTheme, getStoredTheme, type Theme } from "../lib/theme.js";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/executions", label: "Executions", end: false },
];

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      className="rounded-md border border-border-hairline px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:border-border-emphasis hover:text-ink-primary"
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-surface-page text-ink-primary">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border-hairline bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border-hairline px-4 py-4">
          <div className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">Sentinel</span>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? "bg-surface-3 text-ink-primary"
                    : "text-ink-secondary hover:bg-surface-2 hover:text-ink-primary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-border-hairline px-4 py-3 text-xs text-ink-muted">
          Engineering Confidence for Autonomous AI Agents
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-hairline px-6 py-3">
          <div className="text-xs text-ink-muted">
            Engineering Confidence for Autonomous AI Agents
          </div>
          <ThemeToggle />
        </header>
        <main className="min-w-0 flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
