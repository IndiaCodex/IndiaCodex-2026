import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@meshsdk/react/styles.css";
import { AuthProvider } from "@/components/AuthProvider";
import { MeshProvider } from "@/components/MeshProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "LifeVault - AI Second Brain",
  description: "Secure, Web3-native AI second brain for your documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
        <MeshProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MeshProvider>
      </body>
    </html>
  );
}
