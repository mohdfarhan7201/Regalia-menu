import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  // Menu-only mode: redirect non-menu routes to root Digital Menu
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/captain/:path*",
    "/kitchen/:path*",
    "/cashier/:path*",
    "/leads/:path*",
    "/login",
    "/unauthorized",
  ],
};


