import { createServerClient, type CookieOptions } from "@supabase/ssr";
type C = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from "next/server";
import { envReady, publicKey } from "@/lib/supabase/env";

/** Next 16 "proxy" (formerly middleware). Refreshes the session cookie and blocks /admin for signed-out visitors before any page renders. */
export async function proxy(req: NextRequest) {
  if (!envReady()) return NextResponse.redirect(new URL("/setup", req.url));
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey(), {
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
  const go = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, req.url));
    res.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };
  if (!user && path.startsWith("/admin")) return go("/login");
  if (user && path === "/login" && !req.nextUrl.searchParams.has("denied")) return go("/admin");
  return res;
}
export const config = { matcher: ["/admin/:path*", "/login"] };
