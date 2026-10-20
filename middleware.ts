import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/auth';

/**
 * The public app is open to everyone (citizen reporting).
 * Only the /admin panel and admin write operations need a session.
 * Public writes allowed without login: new reports, SOS alerts, area votes
 * (same as the original single-file app — anyone can report).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === '/login' ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Admin pages always need a session
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (ok) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // API: GET is public. POST is public only for citizen submissions.
  if (pathname.startsWith('/api/')) {
    const isVote = /^\/api\/surveys\/\d+\/vote$/.test(pathname);
    const publicPost =
      req.method === 'POST' &&
      (pathname === '/api/reports' ||
        pathname === '/api/sos-alerts' ||
        pathname === '/api/area-ratings' ||
        pathname === '/api/upload' ||
        // Phase 3 — member endpoints enforce their own session auth in the handler
        pathname === '/api/members/register' ||
        pathname === '/api/members/login' ||
        pathname === '/api/members/logout' ||
        isVote);
    // Member self-update enforces the member session inside the handler.
    const memberPatch = req.method === 'PATCH' && pathname === '/api/members/me';
    if (req.method === 'GET' || publicPost || memberPatch) return NextResponse.next();
    const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (ok) return NextResponse.next();
    return Response.json({ error: 'অনুমতি নেই — অ্যাডমিন লগইন করুন' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
