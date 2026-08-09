import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/global.css";

const sans = Inter({
  variable: "--font-ouro-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-ouro-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ouro — Self-Repaying Cardano Loans",
  description:
    "Lock tADA, borrow tUSDM, and let native staking yield repay your debt automatically. No liquidation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning covers ATTRIBUTES OF <html> ONLY (one level):
    // wallet extensions (Eternl/Lace) mutate them before React hydrates.
    // Verified clean in an extension-free browser — nothing app-side differs.
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
