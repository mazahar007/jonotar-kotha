'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCamera, IconVideo, IconX } from './icons';

export interface MediaItem {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

const MAX_FILES = 4;
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

function sizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/** Photo/video picker with client previews and size guards (max 4 files). */
export default function MediaPicker({
  items,
  onChange,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [warning, setWarning] = useState('');
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Revoke object URLs when the picker unmounts.
  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) URL.revokeObjectURL(it.previewUrl);
    };
  }, []);

  function add(files: FileList | null) {
    if (!files) return;
    setWarning('');
    const next = [...items];
    for (const f of Array.from(files)) {
      const isVideo = f.type.startsWith('video/');
      const isImage = f.type.startsWith('image/');
      if (!isVideo && !isImage) {
        setWarning('শুধু ছবি বা ভিডিও যোগ করা যাবে।');
        continue;
      }
      if (isImage && f.size > MAX_IMAGE) {
        setWarning('একদম বড় ছবি — ছবি সর্বোচ্চ ১০MB হতে পারবে।');
        continue;
      }
      if (isVideo && f.size > MAX_VIDEO) {
        setWarning('ভিডিও সর্বোচ্চ ৫০MB হতে পারবে।');
        continue;
      }
      if (next.length >= MAX_FILES) {
        setWarning(`সর্বোচ্চ ${MAX_FILES}টি ফাইল যোগ করা যাবে।`);
        break;
      }
      next.push({ file: f, previewUrl: URL.createObjectURL(f), isVideo });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    URL.revokeObjectURL(items[idx].previewUrl);
    onChange(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-surface py-4 text-sm font-bold text-ink-soft"
      >
        <IconCamera className="h-5 w-5" />
        ছবি / ভিডিও যোগ করুন
        <span className="text-xs font-normal">(সর্বোচ্চ {MAX_FILES}টি)</span>
      </button>

      {warning && <p className="mt-2 text-xs font-semibold text-brand">{warning}</p>}

      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {items.map((it, i) => (
            <div key={it.previewUrl} className="relative aspect-square overflow-hidden rounded-xl bg-overlay">
              {it.isVideo ? (
                <>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={it.previewUrl} className="h-full w-full object-cover" muted playsInline />
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <IconVideo className="h-3 w-3" /> ভিডিও
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.previewUrl} alt="সংযুক্ত ছবি" className="h-full w-full object-cover" />
              )}
              <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {sizeLabel(it.file.size)}
              </span>
              <button
                type="button"
                aria-label="সরিয়ে দিন"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
