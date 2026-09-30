"use client";

import { ConfirmProvider } from "@/contexts/ConfirmContext";

export default function AdminProviders({ children }: { children: React.ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
