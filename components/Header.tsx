import { IconPin } from './icons';
import NotificationBell from './NotificationBell';

/** Phase 19 — floating glassmorphic sticky header pill (Zila Seba style). */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 lg:px-6">
      <div className="glass-pill flex items-center justify-between rounded-3xl px-4 py-3">
        <div>
          <h1 className="text-gradient text-xl font-bold leading-tight">জনতার কথা</h1>
          <p className="flex items-center gap-1 text-xs text-ink-soft">
            <IconPin className="h-3.5 w-3.5" />
            ময়মনসিংহ · গাঙ্গিনাপাড়
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip-violet flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
            <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
            নীরব
          </span>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
