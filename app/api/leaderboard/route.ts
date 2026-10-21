import { ok } from '@/lib/api';
import { getLeaderboard } from '@/lib/points';

/**
 * GET /api/leaderboard — "শীর্ষ অবদানকারী": পয়েন্ট অনুযায়ী সেরা সদস্যরা।
 * শুধু show_on_leaderboard=true সদস্যরা (ডিফল্ট true, প্রোফাইল থেকে বন্ধ
 * করা যায়)। নাম + পয়েন্ট + ব্যাজ — ফোন/ইমেইল কখনোই প্রকাশ করা হয় না।
 */
export async function GET() {
  return ok({ leaders: await getLeaderboard(20) });
}
