import type { Metadata } from "next";
import "./globals.css";
import "@meshsdk/react/styles.css";
import ClientProviders from "./providers";

export const metadata: Metadata = {
  title: "MediChain DAO — Own Your Health Data",
  description:
    "Decentralized, immutable medical records powered by Cardano. Take control of your health data with MediChain DAO.",
  keywords: ["Cardano", "medical records", "blockchain", "DAO", "healthcare", "decentralized"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
