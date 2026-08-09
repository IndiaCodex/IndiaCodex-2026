export const siteConfig = {
  name: "Foundry",
  description: "The Operating System for Autonomous Software Companies on Cardano",
  tagline: "Describe an idea. Watch a company build it.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  links: {
    github: "https://github.com/anomalyco/foundry",
    docs: "https://foundry.ai/docs",
  },
  nav: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Projects", href: "/projects", icon: "FolderKanban" },
    { label: "Marketplace", href: "/marketplace", icon: "Store" },
    { label: "Settings", href: "/settings", icon: "Settings" },
  ] as const,
};
