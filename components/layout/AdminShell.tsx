"use client";
import { useCallback, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function AdminShell({ children, userName }: { children: React.ReactNode; userName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  return <>
    <Sidebar open={menuOpen} collapsed={collapsed} onClose={closeMenu} />
    <div className={`${collapsed ? "" : "lg:pl-64"} print:pl-0`}>
      <TopBar userName={userName} menuOpen={menuOpen} sidebarCollapsed={collapsed} onToggleMenu={() => setMenuOpen((value) => !value)} onToggleSidebar={() => setCollapsed((value) => !value)} />
      {children}
    </div>
  </>;
}
