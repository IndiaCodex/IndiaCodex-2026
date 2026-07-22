export type Theme = "dark" | "light";

const STORAGE_KEY = "sentinel-theme";

/** Dark is the product default — only an explicit prior choice switches to light. */
export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
