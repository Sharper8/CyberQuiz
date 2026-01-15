"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AccessibilityProvider } from "@/lib/accessibility-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}
