'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import MemberOtpLogin from '@/components/MemberOtpLogin';
import PhoneVerify from '@/components/PhoneVerify';
import ProfilePoints from '@/components/ProfilePoints';
import PushSubscribeToggle from '@/components/PushSubscribeToggle';
import TrustedContacts from '@/components/TrustedContacts';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import { IconCheck, IconChevronRight, IconLock, IconPin, IconShield, IconUser, IconUsers } from '@/components/icons';
import { logoutMember, updateMe, useMember } from '@/lib/member';

import { InstallAppButton } from '@/components/PwaClient';

export default function ProfilePage() {
  const { member, setMember } = useMember();
  const [editingArea, setEditingArea] = useState(false);
  const [newCurrent, setNewCurrent] = useState<LocationSelection>(EMPTY_LOCATION);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (member) setNewCurrent(member.current);
  }, [member]);

  async function saveArea() {
    setSaving(true);
    setMsg('');
    try {
      const updated = await updateMe({ current: newCurrent });
      setMember(updated);
      setEditingArea(false);
      setMsg('বর্তমান এলাকা আপডেট হয়েছে');
    } catch {
      setMsg('আপডেট করা যায়নি');
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible() {
    if (!member) return;
    try {
      const updated = await updateMe({ is_visible: !member.is_visible });
      setMember(updated);
    } catch {
      /* ignore */
    }
  }

  async function doLogout() {
    await logoutMember();
    setMember(null);
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl min-h-dvh bg-cream px-4 pb-10 pt-4">
        {member === undefined ? (
          <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
        ) : member ? (
          <>
            <div className="flex items-center gap-4 rounded-3xl bg-surface border border-line p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cream-dark text-2xl font-bold text-ink">
                {member.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-ink">{member.name}</h1>
                {member.phone && <p className="text-sm text-ink-soft">{member.phone}</p>}
                {member.email && <p className="text-sm text-ink-soft">{member.email}</p>}
                <p className="mt-0.5 text-xs font-semibold text-emerald-300">নিবন্ধিত সদস্য</p>
                {/* Phase 13 — verification status chip */}
                {member.account_status === 'verified' ? (
                  <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    ✅ ভেরিফাইড
                  </span>
                ) : (
                  <span className="mt-1.5 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
                    ⏳ আনভেরিফাইড — ফোন যাচাই করুন
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-surface border border-line p-5 shadow-sm">
              <div className="space-y-2 text-sm">
                <p className="flex gap-2">
                  <span className="w-28 shrink-0 font-bold text-ink-soft">নিজ এলাকা</span>
                  <span className="font-semibold text-ink">{member.home_breadcrumb || '—'}</span>
                </p>
                <p className="flex gap-2">
                  <span className="w-28 shrink-0 font-bold text-ink-soft">বর্তমান এলাকা</span>
                  <span className="font-semibold text-ink">{member.current_breadcrumb || '—'}</span>
                </p>
                <p className="text-xs text-ink-soft">বর্তমান এলাকা = আপনার নিজের দেওয়া তথ্য (GPS দিয়ে নেওয়া নয়)।</p>
              </div>

              {!editingArea ? (
                <button
                  onClick={() => setEditingArea(true)}
                  className="mt-4 w-full rounded-2xl bg-cream-dark py-3 text-sm font-bold text-ink"
                >
                  বর্তমান এলাকা বদলান
                </button>
              ) : (
                <div className="mt-4">
                  <LocationPicker value={newCurrent} onChange={setNewCurrent} />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={saveArea}
                      disabled={saving}
                      className="flex-1 rounded-2xl btn-gradient py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                    </button>
                    <button
                      onClick={() => setEditingArea(false)}
                      className="rounded-2xl bg-cream-dark px-5 py-3 text-sm font-bold text-ink"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              )}
              {msg && <p className="mt-3 text-sm font-semibold text-emerald-300">{msg}</p>}

              {/* Phase 13 — phone verification / add-phone for email-only accounts */}
              <PhoneVerify member={member} onVerified={(m) => setMember(m)} />

              <button
                onClick={toggleVisible}
                className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-cream p-4 text-left"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${member.is_visible ? 'bg-emerald-500 text-white' : 'bg-surface shadow-inner'}`}
                >
                  {member.is_visible && <IconCheck className="h-4 w-4" />}
                </span>
                <span className="text-sm text-ink">
                  <span className="font-semibold">এলাকার সদস্যদের কাছে আমাকে দেখান</span>
                  <span className="block text-xs text-ink-soft">
                    {member.is_visible ? 'চালু — আপনার এলাকার মানুষ আপনার বর্তমান এলাকা দেখতে পাবেন' : 'বন্ধ — শুধু সংখ্যায় গণনা হবে, নাম দেখা যাবে না'}
                  </span>
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 rounded-3xl bg-surface border border-line p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark text-2xl font-bold text-ink">
              <IconUser className="h-8 w-8" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-ink">নাগরিক</h1>
              <p className="text-sm text-ink-soft">ময়মনসিংহ · গাঙ্গিনাপাড়</p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <PushSubscribeToggle memberId={member?.id ?? null} />
        </div>

        {/* Phase 15 — পয়েন্ট, ব্যাজ, অর্জিত/কাটা তালিকা, লিডারবোর্ড টগল */}
        {member && <ProfilePoints member={member} onMemberChange={setMember} />}

        <div className="mt-3">
          <InstallAppButton />
        </div>

        {member && <TrustedContacts />}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {!member && (
            <>
              <Link href="/register" className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
                  <IconUsers className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-ink">নিবন্ধন</span>
                  <span className="block text-xs text-ink-soft">সদস্য হয়ে জরিপে ভোট দিন, এলাকার মানুষ দেখুন</span>
                </span>
                <IconChevronRight className="h-5 w-5 text-ink-soft" />
              </Link>

              <div className="rounded-2xl bg-surface border border-line p-4 shadow-sm">
                <span className="block text-sm font-bold text-ink">আগে থেকে নিবন্ধিত?</span>
                <span className="block text-xs text-ink-soft">মোবাইল নম্বর বা ইমেইলে পাঠানো কোড দিয়ে প্রবেশ করুন</span>
                <div className="mt-2.5">
                  <MemberOtpLogin />
                </div>
              </div>
            </>
          )}

          <Link href="/amar-elaka" className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <IconPin className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">আমার এলাকার মানুষ</span>
              <span className="block text-xs text-ink-soft">কে নিজ এলাকায়, কে অন্য এলাকায় আছেন</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>

          <Link href="/surveys" className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
              <IconCheck className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">এলাকার জরিপ</span>
              <span className="block text-xs text-ink-soft">আপনার এলাকার জরিপে মতামত দিন</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>

          <Link href="/locker" className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-overlay text-ink">
              <IconLock className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">প্রমাণ লকার</span>
              <span className="block text-xs text-ink-soft">এনক্রিপ্টেড প্রমাণ দেখুন</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>

          <Link href="/family" className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <IconShield className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">সাহায্য</span>
              <span className="block text-xs text-ink-soft">জরুরি হটলাইন: ৯৯৯ · ১০৯ · ৩৩৩</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>

          {member && (
            <button onClick={doLogout} className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 text-left shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <IconUser className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">লগআউট</span>
                <span className="block text-xs text-ink-soft">এই ডিভাইস থেকে বের হয়ে যান</span>
              </span>
              <IconChevronRight className="h-5 w-5 text-ink-soft" />
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-ink-soft">জনতার কথা · ময়মনসিংহ</p>
      </main>
      <BottomNav />
    </>
  );
}
