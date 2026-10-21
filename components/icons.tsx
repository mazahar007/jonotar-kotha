type P = { className?: string };

const base = (className?: string) => ({
  className,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
});

export const IconHome = ({ className }: P) => (
  <svg {...base(className)}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
);
export const IconMap = ({ className }: P) => (
  <svg {...base(className)}><path d="M14.1 5.6 9 3 3.7 5.2a1 1 0 0 0-.7 1v13.4a.5.5 0 0 0 .7.5L9 18l5.1 2.6L19.3 18a1 1 0 0 0 .7-1V3.6a.5.5 0 0 0-.7-.4L14.1 5.6Z" /><path d="M9 3v15M14.1 5.6V21" /></svg>
);
export const IconDroplet = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>
);
export const IconUser = ({ className }: P) => (
  <svg {...base(className)}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
export const IconPhone = ({ className }: P) => (
  <svg {...base(className)}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z" /></svg>
);
export const IconPhoneOff = ({ className }: P) => (
  <svg {...base(className)}><path d="M10.7 13.3a16 16 0 0 1-2.6-3.4l1.2-1.3a2 2 0 0 0 .5-2.1c-.3-1-.6-2-.7-3A2 2 0 0 0 7.1 2H4.1a2 2 0 0 0-2 2.2c.3 2.9 1.4 5.7 3.1 8.1l-2.5 5.4a1 1 0 0 0 1.7 1l2.2-1.1" /><path d="m2 2 20 20" /><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-2.9-2.4" /></svg>
);
export const IconAlert = ({ className }: P) => (
  <svg {...base(className)}><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" /><path d="M12 9v4M12 17h.01" /></svg>
);
export const IconShield = ({ className }: P) => (
  <svg {...base(className)}><path d="M20 13c0 5-3.5 7.5-7.7 9a.6.6 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconUsers = ({ className }: P) => (
  <svg {...base(className)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>
);
export const IconLock = ({ className }: P) => (
  <svg {...base(className)}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
export const IconStar = ({ className }: P) => (
  <svg {...base(className)}><path d="M11.5 2.7a.6.6 0 0 1 1 0l2.6 5.4 5.9.8a.6.6 0 0 1 .3 1.1l-4.3 4.1 1 5.8a.6.6 0 0 1-.9.7l-5.1-2.8-5.1 2.8a.6.6 0 0 1-.9-.7l1-5.8L2.7 9.9a.6.6 0 0 1 .3-1.1l5.9-.8z" /></svg>
);
export const IconNav = ({ className }: P) => (
  <svg {...base(className)}><path d="m3 11 19-9-9 19-2-8-8-2z" /></svg>
);
export const IconX = ({ className }: P) => (
  <svg {...base(className)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base(className)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconChevronRight = ({ className }: P) => (
  <svg {...base(className)}><path d="m9 18 6-6-6-6" /></svg>
);
export const IconChevronLeft = ({ className }: P) => (
  <svg {...base(className)}><path d="m15 18-6-6 6-6" /></svg>
);
export const IconMegaphone = ({ className }: P) => (
  <svg {...base(className)}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
);
export const IconVideo = ({ className }: P) => (
  <svg {...base(className)}><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>
);
export const IconHeart = ({ className }: P) => (
  <svg {...base(className)}><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" /></svg>
);
export const IconPin = ({ className }: P) => (
  <svg {...base(className)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const IconClock = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
);
export const IconEye = ({ className }: P) => (
  <svg {...base(className)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconBell = ({ className }: P) => (
  <svg {...base(className)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
);
export const IconVibrate = ({ className }: P) => (
  <svg {...base(className)}><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01M2 8v4M2 12v4M22 8v4M22 12v4" /></svg>
);
export const IconCamera = ({ className }: P) => (
  <svg {...base(className)}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
);
export const IconRoute = ({ className }: P) => (
  <svg {...base(className)}><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></svg>
);
export const IconFlame = ({ className }: P) => (
  <svg {...base(className)}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1-2.1-.2-3.1-.2-3.1s4.7 1 7.2 5c1.6 2.6 2 4.6 1.5 6.5A5.5 5.5 0 0 1 13 20a5.6 5.6 0 0 1-5.3-4.2c-.3-1.2 0-1.7.8-1.3Z" /></svg>
);
export const IconSend = ({ className }: P) => (
  <svg {...base(className)}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>
);
export const IconLogout = ({ className }: P) => (
  <svg {...base(className)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
);
export const IconWifi = ({ className }: P) => (
  <svg {...base(className)}><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
);
