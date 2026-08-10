import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/brand") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();
  const url = request.nextUrl.clone();

  if (hostname.startsWith("admin.") && pathname === "/") {
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }

  if (hostname.startsWith("order.") && pathname === "/") {
    url.pathname = "/shop";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
