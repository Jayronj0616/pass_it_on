// Refreshes the Supabase session cookie on every request so server-side
// reads (Server Components, API routes using lib/supabase/server.ts) see
// an up-to-date session instead of a stale/expired one.
//
// Also enforces the admin/consumer split at the route level:
// - Non-admins (or logged-out users) hitting /admin/* get bounced out.
// - Admins hitting any non-admin page get bounced into /admin — admin
//   accounts shouldn't see the regular browse/dashboard UI at all.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  // Admins get bounced out of the consumer app in general, but the admin
  // Items table links to individual item pages (/items/[id]) so admins can
  // actually look at the listing they're moderating. /items/new (posting)
  // and / (browse grid) are NOT included — admins still shouldn't be
  // posting items or browsing as a regular user, just viewing one on request.
  const isItemDetailRoute = /^\/items\/[^/]+$/.test(pathname) && pathname !== "/items/new";

  if (!user) {
    if (isAdminRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin === true;

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAdminRoute && !isAuthRoute && !isItemDetailRoute && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
