import * as React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-white shadow p-4">{children}</div>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

