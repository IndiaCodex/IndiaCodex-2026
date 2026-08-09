import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import "@meshsdk/react/styles.css";
import "./globals.css";
import "@/styles/buttons.css";
import { Providers } from "./providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foundry — Autonomous Software Companies on Cardano",
  description:
    "The Operating System for Autonomous Software Companies on Cardano. Describe an idea. Watch a company build it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${plexSans.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}