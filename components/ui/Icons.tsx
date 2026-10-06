// SF Symbols-style line icons. currentColor so they follow tint and dark mode.
type P = { size?: number; filled?: boolean; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const HomeIcon = ({ size = 26, filled, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 10.6 12 3.8l8.5 6.8V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.6H9.2v5.6H5A1.5 1.5 0 0 1 3.5 19z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const WalletIcon = ({ size = 26, filled, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="6" width="18" height="13.5" rx="3" fill={filled ? "currentColor" : "none"} />
    <path d="M6 6V5.2A1.7 1.7 0 0 1 8 3.5l9 1.6" />
    <circle cx="16.5" cy="12.75" r="1.3" fill={filled ? "var(--bar)" : "currentColor"} stroke="none" />
  </svg>
);

export const ChatIcon = ({ size = 26, filled, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-.9 0-1.8-.1-2.6-.3L5 19.8l1.2-3.5C4.5 15 3.5 13.1 3.5 11c0-3.9 3.8-7 8.5-7z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const ShelfIcon = ({ size = 26, filled, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6.5 3.5h11A1.5 1.5 0 0 1 19 5v15.5l-7-4.2-7 4.2V5a1.5 1.5 0 0 1 1.5-1.5z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const GearIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const PlusIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ChevronIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.2}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const PhotoIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="14.5" rx="3" />
    <circle cx="9" cy="10" r="1.7" />
    <path d="m4 17.5 4.6-4.3a1.5 1.5 0 0 1 2 0l2.4 2.2 2.6-2.4a1.5 1.5 0 0 1 2 0L20 15.6" />
  </svg>
);

export const MicIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>
);

export const ArrowUpIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.6}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const CheckIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const XIcon = ({ size = 14, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const StopIcon = ({ size = 14, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 14 14" className={className} aria-hidden>
    <rect x="2" y="2" width="10" height="10" rx="2.5" fill="currentColor" />
  </svg>
);

export const ChartIcon = ({ size = 26, filled, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={filled ? 2.3 : 1.8}>
    <path d="M4 20h16M6.5 16.5v-3M10.5 16.5V10M14.5 16.5v-5M18.5 16.5V7" />
    <path d="m6 9.5 4-3.5 4 3 5-5" />
  </svg>
);

export const ArrowRightIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const PencilIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2}>
    <path d="M14.5 5.5 18.5 9.5M4 20l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19z" />
  </svg>
);

export const CalendarIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

// Category icons for the donut and plan rows
export const SparklesIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10 4.5 11.4 9l4.6 1.5-4.6 1.4L10 16.5l-1.4-4.6L4 10.5 8.6 9z" />
    <path d="M17.5 3.5l.6 1.8 1.9.7-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.7zM17.5 15.5l.5 1.4 1.5.6-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.6z" />
  </svg>
);
export const HouseIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 11 12 4.5l8 6.5M6 9.5V20h12V9.5M10 20v-5h4v5" />
  </svg>
);
export const BoltIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z" />
  </svg>
);
export const CapIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m2.5 9.5 9.5-4.5 9.5 4.5-9.5 4.5z" />
    <path d="M6.5 11.5V16c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2v-4.5M21.5 9.5v5" />
  </svg>
);
export const CartIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 4.5h2.2l2.2 10.5h10.2l2-7.5H6.4" />
    <circle cx="9" cy="19" r="1.4" />
    <circle cx="17" cy="19" r="1.4" />
  </svg>
);
export const BusIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="4.5" y="3.5" width="15" height="14" rx="3" />
    <path d="M4.5 11h15M8 17.5V20M16 17.5V20" />
    <circle cx="8.5" cy="14.3" r=".6" fill="currentColor" />
    <circle cx="15.5" cy="14.3" r=".6" fill="currentColor" />
  </svg>
);
export const PiggyIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M19 11.5c0-3.3-3.1-5.5-7-5.5-1.3 0-2.5.2-3.5.7L6 5v3a5.6 5.6 0 0 0-1.8 2.5H3v3.5h1.4c.5 1.2 1.4 2.2 2.6 2.9V19h2.5v-1.6c.8.1 1.6.2 2.5.2s1.7-.1 2.5-.2V19H17v-2.1c1.3-.9 2-2.1 2-3.4z" />
    <path d="M19 11.5h1.5" />
    <circle cx="8" cy="10.5" r=".7" fill="currentColor" />
  </svg>
);
export const PlaneIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10.5 13.5 4 11l1.5-1.5 7.5 1L17 6.5a1.8 1.8 0 0 1 2.5 2.5L15.5 13l1 7.5L15 22l-2.5-6.5-3 3V21L8 22.5 6.5 19 3 17.5 4.5 16h2.5z" />
  </svg>
);
export const GiftIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z" />
  </svg>
);
export const ToothIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5.5C10 4 6.5 3.5 5 6c-1.4 2.4 0 5 .8 7.5.7 2 1 6.5 2.6 6.5 1.5 0 1.5-4.5 3.6-4.5s2.1 4.5 3.6 4.5c1.6 0 1.9-4.5 2.6-6.5.8-2.5 2.2-5.1.8-7.5-1.5-2.5-5-2-7 .5z" />
  </svg>
);
export const MusicIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 18V5.5l11-2V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </svg>
);
export const TagIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);
export const BagIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 8h14l-1 12.5H6zM9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

/** Pick an icon for a plan or purchase from its name. */
export function iconForName(name: string) {
  const n = name.toLowerCase();
  if (/trip|travel|flight|vacation|chicago|hotel/.test(n)) return PlaneIcon;
  if (/gift|birthday|present/.test(n)) return GiftIcon;
  if (/dentist|doctor|health|tooth|medical/.test(n)) return ToothIcon;
  if (/concert|show|music|ticket|festival/.test(n)) return MusicIcon;
  if (/rent|home|house/.test(n)) return HouseIcon;
  if (/grocer|food|dinner|lunch/.test(n)) return CartIcon;
  return TagIcon;
}

export const ImagesIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="7" y="3.5" width="13.5" height="13.5" rx="2.5" />
    <path d="M4.5 7v11a2.5 2.5 0 0 0 2.5 2.5h11" />
    <path d="m7.5 14 3.2-3 2.3 2 2.5-2.3 5 4.5" />
  </svg>
);

export const ResetIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4h4" />
  </svg>
);

export const ArrowLeftIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.2}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const TargetIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r=".8" fill="currentColor" />
  </svg>
);

export const ChevronDownIcon = ({ size = 14, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const FlagIcon = ({ size = 26, filled, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5.5 21V4" />
    <path d="M5.5 4.5c2.5-1.3 4.6-1.3 7 0s4.5 1.3 6.5 0v9c-2 1.3-4 1.3-6.5 0s-4.5-1.3-7 0z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const HeartIcon = ({ size = 26, filled, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" fill={filled ? "currentColor" : "none"} />
  </svg>
);

export const LaptopIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="4.5" y="5" width="15" height="10.5" rx="1.5" />
    <path d="M2.5 18.5h19" />
  </svg>
);

export const ShieldIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const WalletIcon2 = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="6.5" width="17" height="12" rx="2.5" />
    <path d="M6 6.5V5.5a1.5 1.5 0 0 1 1.8-1.5L17 6" />
    <rect x="13.5" y="10.5" width="7" height="4" rx="1.5" />
  </svg>
);

export const UserIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="9.5" r="3.2" />
    <path d="M6.2 18.4c1.3-2.3 3.4-3.4 5.8-3.4s4.5 1.1 5.8 3.4" />
  </svg>
);

export const WaveIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2}>
    <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
  </svg>
);

/** Icon + tint for a goal, from its name. */
export function goalLook(name: string): { Icon: typeof PlaneIcon; bg: string; fg: string; photo?: string } {
  const n = name.toLowerCase();
  if (/japan/.test(n)) return { Icon: PlaneIcon, bg: "#dfeaf2", fg: "#3d5f86", photo: "/goals/japan.jpg" };
  if (/trip|travel|japan|california|vacation|flight/.test(n)) return { Icon: PlaneIcon, bg: "#dfeaf2", fg: "#3d5f86" };
  if (/laptop|computer|phone|tablet/.test(n)) return { Icon: LaptopIcon, bg: "#e6e8ee", fg: "#4a5263" };
  if (/apartment|home|house|rent|move/.test(n)) return { Icon: HouseIcon, bg: "#ede4d8", fg: "#7a5a3a" };
  if (/emergency|safety|fund|rainy/.test(n)) return { Icon: ShieldIcon, bg: "#e3ead2", fg: "#4f6b2c" };
  return { Icon: FlagIcon, bg: "#efe8dc", fg: "#6b5a44" };
}
