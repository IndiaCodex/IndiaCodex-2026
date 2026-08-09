'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ToastProvider } from './ToastProvider';

// Dynamically import MeshProviderWrapper with SSR disabled to prevent 
// WASM execution on the server during Next.js static build pre-rendering.
const MeshProviderWrapper = dynamic(
  () => import('./MeshProviderWrapper'),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <MeshProviderWrapper>
        {children}
      </MeshProviderWrapper>
    </ToastProvider>
  );
}
