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
    // Phase 8 — push subscribe/unsubscribe are public citizen writes
    // (the toggle lives on the login-free profile page); /api/push/send
    // stays admin-gated (and also checks requireAdmin() in the handler).
    // Phase 11 — trusted contacts POST/DELETE are member-session writes
    // (the handlers return 401 when no member session is present).
    const isContactPath = /^\/api\/contacts(\/[^/]+)?$/.test(pathname);
    const isPushSubWrite =
      req.method === 'POST' &&
      (pathname === '/api/push/subscribe' || pathname === '/api/push/unsubscribe');
    // Phase 7 — report comments + "আমিও দেখেছি" verify votes are public
    // citizen writes (same spirit as survey votes); the handlers enforce
    // the anti-spam interval and one-vote-per-voter rules.
    const isCommentPost = /^\/api\/reports\/\d+\/comments$/.test(pathname);
    const isVerifyPost = /^\/api\/reports\/\d+\/verify$/.test(pathname);
    // Phase 4 — posting a road update ("লাইভ আপডেট দিন") goes through the
    // middleware as a public POST; Phase 14 gates it in the handler (member
    // session required → 401 when logged out).
    const isRoadUpdate = /^\/api\/roads\/\d+\/updates$/.test(pathname);
    // Phase 14 — "⚡ এক ট্যাপে জানান" one-tap quick post is a member-session
    // write; the handler itself returns 401 when there is no session.
    const isQuickPost = req.method === 'POST' && pathname === '/api/roads/quick-post';
    // Phase 17 — "অবস্থা জানান" submit page (member-session write;
    // the handler itself returns 401 when there is no session).
    const isRoadSubmit = req.method === 'POST' && pathname === '/api/roads/submit';
    // Phase 18 — "🔔 বর্তমান অবস্থা জানতে চাই" status request
    // (member-session write; the handler returns 401 when logged out).
    const isStatusRequest = /^\/api\/roads\/\d+\/request$/.test(pathname);
    // Phase 6 — live location share create + owner ping/stop are public writes
    // (ping/stop are secured by the owner_token inside the handlers).
    const isLiveShareWrite =
      pathname === '/api/live-shares' ||
      /^\/api\/live-shares\/[^/]+\/(ping|stop)$/.test(pathname);
    // Phase 13 — member OTP auth endpoints enforce their own rules in the handler
    // (registration + login OTP are intentionally public; verify_phone and
    // add-phone require a logged-in member session inside the handler).
    const isMemberAuth = pathname.startsWith('/api/member-auth/');
    const publicPost =
      req.method === 'POST' &&
      (pathname === '/api/reports' ||
        pathname === '/api/sos-alerts' ||
        pathname === '/api/area-ratings' ||
        pathname === '/api/upload' ||
        isRoadUpdate ||
        isQuickPost ||
        isRoadSubmit ||
        isStatusRequest ||
        isLiveShareWrite ||
        isCommentPost ||
        isVerifyPost ||
        isPushSubWrite ||
        isContactPath ||
        // Phase 3 — member endpoints enforce their own session auth in the handler
        pathname === '/api/members/register' ||
        pathname === '/api/members/login' ||
        pathname === '/api/members/logout' ||
        isMemberAuth ||
        isVote);
    // Phase 11 — DELETE on contacts is also a member-session write.
    const contactDelete = req.method === 'DELETE' && isContactPath;
    // Phase 15 — likes toggle + star ratings are member-session writes;
    // the handlers themselves return 401 when there is no member session.
    const isLikeToggle = req.method === 'POST' && pathname === '/api/likes/toggle';
    const isRatingWrite = req.method === 'POST' && pathname === '/api/ratings';
    // Member self-update enforces the member session inside the handler.
    const memberPatch = req.method === 'PATCH' && pathname === '/api/members/me';
    if (req.method === 'GET' || publicPost || memberPatch || contactDelete || isLikeToggle || isRatingWrite)
      return NextResponse.next();
    const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (ok) return NextResponse.next();
    return Response.json({ error: 'অনুমতি নেই — অ্যাডমিন লগইন করুন' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
