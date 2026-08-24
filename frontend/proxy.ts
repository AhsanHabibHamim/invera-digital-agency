import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Server-side route protection. The backend also enforces every API guard;
// this prevents unauthenticated users from rendering protected shells.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/client");

  // Not authenticated -> send to login, carrying the intended destination.
  if (isProtected && !accessToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/client/:path*"],
};