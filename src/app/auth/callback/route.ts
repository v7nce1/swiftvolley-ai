import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /auth/callback — OAuth callback handler
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    // Redirect to auth with error message
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: { path?: string; expires?: Date; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none'; } }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("OAuth exchange error:", exchangeError);
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("error", exchangeError.message);
      return NextResponse.redirect(url);
    }

    // Successfully authenticated, redirect to home
    return NextResponse.redirect(new URL("/home", request.url));
  } catch (e) {
    console.error("Auth callback error:", e);
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("error", "Authentication failed");
    return NextResponse.redirect(url);
  }
}



