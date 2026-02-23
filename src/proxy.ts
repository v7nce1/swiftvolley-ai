import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Skip Supabase auth check if env vars are missing (e.g., during build)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, any> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname, search } = request.nextUrl;

  // Handle OAuth callback (code from Google/Microsoft)
  if (pathname === "/auth/callback" && search.includes("code=")) {
    try {
      const code = request.nextUrl.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    } catch (e) {
      console.error("OAuth exchange error:", e);
      return NextResponse.redirect(new URL("/auth?error=exchange_failed", request.url));
    }
    // Redirect to home after successful exchange
    return NextResponse.redirect(new URL("/home", request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user is in guest mode (stored in request cookies)
  const guestMode = request.cookies.get("guest_mode")?.value === "true";

  const protectedPaths = ["/home", "/record", "/results", "/history", "/settings"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // Allow access if user is authenticated OR in guest mode
  if (isProtected && !user && !guestMode) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Set guest mode cookie if needed (guest must be in localStorage client-side, server mirrors it)
  if (guestMode && !request.cookies.has("guest_mode")) {
    supabaseResponse.cookies.set("guest_mode", "true", { maxAge: 86400 * 7 }); // 7 days
  }

  if (pathname === "/auth" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};