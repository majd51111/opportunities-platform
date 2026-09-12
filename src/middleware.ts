import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { routes } from "@/config/routes";

const protectedPrefixes = [
  routes.platform.favorites,
  routes.platform.profile,
  routes.platform.reports,
  routes.platform.submitOpportunity,
  routes.platform.supportRequests,
  routes.admin.dashboard,
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = routes.auth.login;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileData?.status === "suspended" || profileData?.status === "banned") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL(routes.auth.login, request.url));
  }

  if (pathname === routes.admin.dashboard || pathname.startsWith(`${routes.admin.dashboard}/`)) {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || !["admin", "support"].includes(roleData.role)) {
      return NextResponse.redirect(new URL(routes.public.home, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
