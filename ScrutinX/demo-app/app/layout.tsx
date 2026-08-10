import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adaptive Concurrency-Aware Batcher — Cardano",
  description:
    "Reusable adaptive batching infrastructure for Cardano: detect UTXO conflicts, read live congestion, settle non-conflicting requests in one transaction.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
