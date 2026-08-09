"use client";

import { type ReactNode } from "react";
import { MeshProvider } from "@meshsdk/react";
import { usePathname } from "next/navigation";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LandingHeader } from "@/components/layout/landing-header";
import { WalletPersistence } from "@/components/wallet/wallet-persistence";

const publicRoutes = ["/"];

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = publicRoutes.includes(pathname);

  return (
    <ThemeProvider>
      <QueryProvider>
        <MeshProvider>
          <WalletPersistence />
          <ToastProvider>
            <div className="flex min-h-screen">
              {!isPublic && <Sidebar />}
              <main className={`flex-1 ${!isPublic ? "ml-64" : ""} transition-all duration-300`}>
                {isPublic ? <LandingHeader /> : <Header />}
                {children}
              </main>
            </div>
          </ToastProvider>
        </MeshProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}