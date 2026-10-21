/**
 * Phase 15 — client helper: award API গুলো { newBadges } ফেরত দিলে এই
 * ফাংশনে পাঠালে গ্লোবাল টোস্ট ওঠে ("🏆 নতুন ব্যাজ!")।
 */
export function announceBadges(badges: unknown): void {
  if (typeof window === 'undefined') return;
  if (!Array.isArray(badges) || badges.length === 0) return;
  window.dispatchEvent(new CustomEvent('jk:badges', { detail: badges as string[] }));
}
