import { redirect } from "next/navigation";
import { DemoBanner } from "@/components/DemoBanner";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { VersionBadge } from "@/components/VersionBadge";
import { isDemo } from "@/lib/supabase/env";
import { createServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, error } = await (await createServer()).rpc("is_admin");
  if (error) redirect("/setup?step=database");
  if (!isAdmin) redirect("/login?denied=1");
  const demo = isDemo();
  let userName: string | undefined;
  if (demo) userName = "Demo admin";
  else {
    const { data } = await (await createServer()).auth.getUser();
    userName = data.user?.email ?? undefined;
  }
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 print:hidden">Skip to content</a>
      <Sidebar demo={demo} />
      <div className="lg:pl-64 print:pl-0">
        <TopBar userName={userName} demo={demo} />
        {demo && <div className="w-full px-4 pt-4 sm:px-6 lg:px-10 2xl:px-12"><DemoBanner /></div>}
        <main id="main" className="w-full px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:py-8 2xl:px-12">{children}</main>
        <VersionBadge />
      </div>
    </>
  );
}
