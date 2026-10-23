"use client";
import { Printer } from "lucide-react";
export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return <button onClick={() => window.print()} className="clay-btn no-print"><Printer size={18} /> {label}</button>;
}
