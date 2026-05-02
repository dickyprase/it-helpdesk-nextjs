import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths yang bisa diakses tanpa login
const authPaths = ['/login', '/register']; // redirect ke dashboard jika sudah login
const openPaths = ['/docs'];               // selalu bisa diakses, tidak redirect

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('helpdesk_session');

  // /docs — selalu bisa diakses, tidak pernah redirect
  if (openPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // /login, /register — redirect ke dashboard jika sudah login
  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Protect all other routes — redirect ke login jika belum login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
