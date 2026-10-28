import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { VersionBadge } from "@/components/VersionBadge";
import { createServer, getServerUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await createServer();
  const [{ data: isAdmin, error }, { data }] = await Promise.all([sb.rpc("is_admin"), getServerUser()]);
  if (error) redirect("/setup?step=database");
  if (!isAdmin) redirect("/login?denied=1");
  const userName = data.user?.email;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 print:hidden">Skip to content</a>
      <Sidebar />
      <div className="lg:pl-64 print:pl-0">
        <TopBar userName={userName} />
        <main id="main" className="w-full px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:py-8 2xl:px-12">{children}</main>
        <VersionBadge />
      </div>
    </>
  );
}
