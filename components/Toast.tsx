"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

export type Kind = "success" | "error" | "warning" | "info";
const STYLE = {
  success: { cls: "border-green-300 bg-green-50 text-green-900", Icon: CheckCircle2 },
  error: { cls: "border-red-300 bg-red-50 text-red-900", Icon: XCircle },
  warning: { cls: "border-amber-300 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  info: { cls: "border-sky-300 bg-sky-50 text-sky-900", Icon: Info },
} as const;

/** Every message gets a category from its wording, so messages look and sound consistent. */
export function kindOf(m: string): Kind {
  if (/^(could not|failed|save failed|wrong)/i.test(m)) return "error";
  if (/^(enter|select|add |no |nothing|mismatch)/i.test(m)) return "warning";
  if (/(saved|deleted|verified|reset|sent|imported)/i.test(m)) return "success";
  return "info";
}

const Ctx = createContext<(m: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<{ id: number; m: string; kind: Kind }[]>([]);
  const push = useCallback((m: string, kind: Kind = kindOf(m)) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, m, kind }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), kind === "error" ? 5500 : 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 left-1/2 z-[60] w-[92%] max-w-sm -translate-x-1/2 space-y-2 print:hidden">
        {list.map(({ id, m, kind }) => { const { cls, Icon } = STYLE[kind]; return (
          <div key={id} role={kind === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${cls}`}><Icon size={18} className="mt-0.5 shrink-0" />{m}</div>); })}
      </div>
    </Ctx.Provider>
  );
}
