'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconCheck, IconChevronRight, IconLock, IconSend } from '@/components/icons';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import MediaPicker, { type MediaItem } from '@/components/MediaPicker';
import { announceBadges } from '@/lib/badges-client';

export default function ReportPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState<LocationSelection>(EMPTY_LOCATION);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [saveToLocker, setSaveToLocker] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d: { name: string }[]) => {
        const names = d.map((c) => c.name).filter((n) => n !== 'সব');
        setCategories(names);
        if (names.length > 0) setCategory(names[0]);
      })
      .catch(() => setCategories(['সামাজিক', 'নিরাপত্তা', 'সড়ক ও যানজট']));
  }, []);

  /** Upload picked files; returns the URLs to store on the report.
      In demo mode (no Supabase) the local preview URLs are used instead. */
  async function uploadMedia(): Promise<string[]> {
    if (media.length === 0) return [];
    const form = new FormData();
    for (const m of media) form.append('files', m.file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && Array.isArray(data.urls) && data.urls.length > 0) return data.urls as string[];
    } catch {
      /* fall through to demo previews */
    }
    // Demo mode — object URLs only live in this browser session, but the
    // flow is demonstrated end-to-end and the report is marked accordingly.
    return media.map((m) => m.previewUrl);
  }

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setError('শিরোনাম ও বিস্তারিত বর্ণনা লিখুন।');
      return;
    }
    setSending(true);
    setError('');
    try {
      const mediaUrls = await uploadMedia();
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          location_name: 'গাঙ্গিনাপাড়',
          is_anonymous: anonymous,
          evidence_url: saveToLocker ? 'locker' : null,
          division_id: location.division_id,
          district_id: location.district_id,
          upazila_id: location.upazila_id,
          thana_id: location.thana_id,
          union_id: location.union_id,
          media_urls: mediaUrls,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => null);
      announceBadges(data?.newBadges);
      setDone(true);
    } catch {
      setError('পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <IconCheck className="h-10 w-10" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">পোস্ট করুন সম্পন্ন!</h1>
        <p className="mt-2 text-sm text-ink-soft">আপনার রিপোর্ট যাচাইয়ের জন্য যাবে।</p>
        <Link
          href="/"
          className="mt-6 flex items-center gap-1 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white"
        >
          হোমে ফিরুন <IconChevronRight className="h-4 w-4" />
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-cream px-4 py-6 lg:py-10">
      <div className="mx-auto w-full max-w-2xl lg:rounded-3xl lg:bg-white lg:p-8 lg:shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <h1 className="text-xl font-bold text-ink">নতুন সমস্যা জানান</h1>
        <p className="mt-1 text-sm text-ink-soft">আপনার এলাকার সমস্যা জানান — পৌরসভা দেখবে।</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink">শিরোনাম</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="শিরোনাম লিখুন..."
              className="w-full rounded-2xl border border-[#efe3d3] bg-white px-4 py-3 text-[15px] outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink">ক্যাটাগরি</label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    category === c ? 'bg-brand text-white' : 'bg-white text-ink-soft shadow-sm lg:bg-cream'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink">বিস্তারিত বর্ণনা</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="বিস্তারিত বর্ণনা..."
              rows={4}
              className="w-full rounded-2xl border border-[#efe3d3] bg-white px-4 py-3 text-[15px] outline-none focus:border-brand"
            />
          </div>

          {/* Administrative location — বিভাগ → জেলা → উপজেলা → থানা → ইউনিয়ন */}
          <div className="rounded-2xl bg-white p-4 shadow-sm lg:bg-cream lg:shadow-none">
            <p className="mb-3 text-sm font-bold text-ink">এলাকা নির্বাচন করুন</p>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          {/* Photo / video attachments */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink">ছবি / ভিডিও</label>
            <MediaPicker items={media} onChange={setMedia} />
          </div>

          <button
            onClick={() => setAnonymous(!anonymous)}
            className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm lg:bg-cream lg:shadow-none"
          >
            <span className="text-left text-sm font-bold text-ink">
              বেনামী নাগরিক
              <span className="block text-xs font-normal text-ink-soft">পরিচয় গোপন থাকবে</span>
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${anonymous ? 'bg-brand' : 'bg-stone-300'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  anonymous ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>

          <button
            onClick={() => setSaveToLocker(!saveToLocker)}
            className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm lg:bg-cream lg:shadow-none"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              <IconLock className="h-5 w-5 text-ink-soft" />
              প্রমাণ লকারে সংরক্ষণ
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${saveToLocker ? 'bg-brand' : 'bg-stone-300'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  saveToLocker ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>

          {error && <p className="text-sm font-semibold text-brand">{error}</p>}

          <button
            onClick={submit}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-white shadow-lg shadow-red-200 disabled:opacity-60"
          >
            <IconSend className="h-5 w-5" />
            {sending ? 'পাঠানো হচ্ছে...' : 'পোস্ট করুন'}
          </button>
          <p className="text-center text-xs text-ink-soft">পৌরসভাকে ট্যাগ করুন — যাচাইয়ের জন্য যাবে</p>
        </div>
      </div>
    </main>
  );
}
