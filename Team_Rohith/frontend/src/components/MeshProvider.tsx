"use client";

import { MeshProvider as Provider } from "@meshsdk/react";

export const MeshProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider>
      {children}
    </Provider>
  );
};
