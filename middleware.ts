import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

/**
 * Next js middleware function
 */
export async function middleware(req: NextRequest) {

  // Skip static assets check
  if (req.nextUrl.pathname.match(/\.(png|jpg|jpeg|svg|gif|js|css|ico)$/)) {
    return NextResponse.next();
  }

  // Fetch token with exact settings from app/auth.ts
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: 'next-auth.session-token',
    secureCookie: process.env.NODE_ENV === 'production'
  });

  const isAuthenticated = !!token;
  
  if ( process.env.NEXT_PUBLIC_DEBUG_MODE ) {
    console.log(`[Middleware] Path: ${req.nextUrl.pathname}, Authenticated: ${isAuthenticated}`);
  }

  // Redirect logic
  if (
    isAuthenticated &&
    (
      req.nextUrl.pathname === '/' )
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (
    !isAuthenticated &&
    (
      req.nextUrl.pathname === '/' ||
      req.nextUrl.pathname.startsWith('/dashboard')
    )
  ) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return NextResponse.next();
}

/**
 * Define the config matchers
 */
export const config = {
  matcher: [
    '/',                       // home page
    '/dashboard',              // dashboard main
    '/dashboard/:path*',       // all subpaths of dashboard
  ],
};
