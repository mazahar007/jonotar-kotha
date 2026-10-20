/** Bengali numeral + relative-time helpers (used by roads "লাইভ আপডেট"). */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function bnNum(v: number | string): string {
  return String(v).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** "এইমাত্র / ৫ মিনিট আগে / ২ ঘণ্টা আগে / ৩ দিন আগে" — Bengali numerals. */
export function timeAgoBn(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return 'এইমাত্র';
  const m = Math.floor(s / 60);
  if (m < 60) return `${bnNum(m)} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${bnNum(h)} ঘণ্টা আগে`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${bnNum(d)} দিন আগে`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${bnNum(w)} সপ্তাহ আগে`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${bnNum(mo)} মাস আগে`;
  return `${bnNum(Math.floor(d / 365))} বছর আগে`;
}
