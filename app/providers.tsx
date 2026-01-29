"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AccessibilityProvider } from "@/lib/accessibility-context";

const queryClientRef = { current: null as QueryClient | null };

export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  // Only create QueryClient on client side
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}
