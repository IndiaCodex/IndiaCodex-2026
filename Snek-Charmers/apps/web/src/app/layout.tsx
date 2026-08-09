import type { Metadata } from "next";
import localFont from "next/font/local";
import { Unbounded } from "next/font/google";
import "./globals.css";
import "@meshsdk/react/styles.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  title: "Snekpad — fair-launch meme coins on Cardano",
  description: "Launch a coin, ape the bonding curve, graduate to Minswap. Cardano Preprod.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
