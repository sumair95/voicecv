import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isAuthRoute =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup") ||
    url.pathname.startsWith("/forgot-password");
  // /reset-password is intentionally NOT in the bounce list: it carries
  // an auth-recovery token in the URL fragment that Supabase parses
  // client-side, so logged-in users must still be able to reach it.
  const isProtected =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/record") ||
    url.pathname.startsWith("/cv") ||
    url.pathname.startsWith("/jobs") ||
    url.pathname.startsWith("/onboarding");

  if (!user && isProtected) {
    const loginUrl = url.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    const dashboardUrl = url.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
