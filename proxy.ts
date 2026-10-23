import { createServerClient, type CookieOptions } from "@supabase/ssr";
type C = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from "next/server";
import { envReady } from "@/lib/supabase/env";

/** Next 16 "proxy" (formerly middleware). Refreshes the session cookie and blocks /admin for signed-out visitors before any page renders. */
export async function proxy(req: NextRequest) {
  if (!envReady()) return NextResponse.next(); // no keys: demo mode, no login wall
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: C[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  const path = req.nextUrl.pathname;
  if (!user && path.startsWith("/admin")) return NextResponse.redirect(new URL("/login", req.url));
  if (user && path === "/login" && !req.nextUrl.searchParams.has("denied")) return NextResponse.redirect(new URL("/admin", req.url));
  return res;
}
export const config = { matcher: ["/admin/:path*", "/login"] };
