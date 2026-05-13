import { NextRequest, NextResponse } from "next/server";

const BUYER_PROTECTED = ["/profile", "/orders", "/wishlist", "/checkout", "/cart"];
const SELLER_ONLY = ["/seller"];
const ADMIN_ONLY = ["/admin"];
const AUTH_PATHS = ["/login", "/register"];

function decodeToken(token: string): { userId: string; role: string } | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth-token")?.value;
  const payload = token ? decodeToken(token) : null;

  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isBuyerProtected = BUYER_PROTECTED.some((p) => pathname.startsWith(p));
  const isSellerRoute = SELLER_ONLY.some((p) => pathname.startsWith(p));
  const isAdminRoute = ADMIN_ONLY.some((p) => pathname.startsWith(p));

  // Redirect logged-in users away from auth pages
  if (isAuthPage && payload) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Require login for buyer-protected pages
  if (isBuyerProtected && !payload) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /seller/register is a public marketing page — no auth required
  const isSellerRegister = pathname === "/seller/register";

  // All other seller routes: must be SELLER or ADMIN
  if (isSellerRoute && !isSellerRegister) {
    if (!payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (payload.role !== "SELLER" && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/seller/register", req.url));
    }
  }

  // Admin routes: must be ADMIN
  if (isAdminRoute) {
    if (!payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/orders/:path*",
    "/wishlist",
    "/cart",
    "/checkout/:path*",
    "/seller/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
