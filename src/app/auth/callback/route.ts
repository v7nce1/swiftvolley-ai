import { NextRequest, NextResponse } from "next/server";

// GET /auth/callback — OAuth callback (should be intercepted by middleware)
export async function GET(request: NextRequest) {
  // This should not be reached due to middleware redirect in proxy.ts
  // but we need the route to exist for TypeScript validation
  return NextResponse.redirect(new URL("/home", request.url));
}



