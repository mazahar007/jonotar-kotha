import { IconBell, IconPin } from './icons';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#efe3d3] bg-cream/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div>
          <h1 className="text-xl font-bold leading-tight text-ink">জনতার কথা</h1>
          <p className="flex items-center gap-1 text-xs text-ink-soft">
            <IconPin className="h-3.5 w-3.5" />
            ময়মনসিংহ · গাঙ্গিনাপাড়
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-[#efe9ff] px-2.5 py-1 text-xs font-semibold text-[#5b3df0]">
            <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-[#5b3df0]" />
            নীরব
          </span>
          <button
            aria-label="নোটিফিকেশন"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm"
          >
            <IconBell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
