import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export const metadata: Metadata = {
  title: "Genesis Dashboard",
  description: "Manage and monitor your AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground" suppressHydrationWarning>
        <Sidebar />
        
        <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
          <Topbar />
          <main className="flex-1 p-6 lg:p-8 w-full max-w-7xl mx-auto">
            {children}
          </main>
        </div>

        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#121214',
            color: '#fafafa',
            border: '1px solid #27272a',
            borderRadius: '12px',
            fontSize: '14px',
          }
        }} />
      </body>
    </html>
  );
}
