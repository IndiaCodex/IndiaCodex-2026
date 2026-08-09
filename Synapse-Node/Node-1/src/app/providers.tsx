"use client";

import { MeshProvider } from "@meshsdk/react";
import { MediChainProvider } from "@/context/MediChainContext";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import NucastAlert from "@/components/NucastAlert";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <MeshProvider>
      <MediChainProvider>
        <Navbar />
        <NucastAlert />
        <Toast />
        <main>{children}</main>
      </MediChainProvider>
    </MeshProvider>
  );
}
