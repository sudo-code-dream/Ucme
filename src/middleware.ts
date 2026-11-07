import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
const PUBLIC = ["/", "/login", "/signup"];
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("ucme_session")?.value;
  let ok = false;
  if (token) { try { await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET)); ok = true; } catch {} }
  if (!ok && !PUBLIC.includes(pathname)) return NextResponse.redirect(new URL("/login", req.url));
  if (ok && (pathname === "/login" || pathname === "/signup")) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico|manifest.webmanifest|sw.js|offline.html|icons/|apple-icon).*)"] };
