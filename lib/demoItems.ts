/**
 * The six demo "photos" in the Talk to Penny gallery. Each one is a small flat illustration
 * (inline SVG, so nothing to download) plus the name and price Penny reads off it.
 */
export type DemoItem = { id: string; name: string; price: number; bg: string; art: string };

const svg = (bg: string, body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${bg}"/>${body}</svg>`,
  )}`;

export const DEMO_ITEMS: DemoItem[] = [
  {
    id: "ticket",
    name: "Taylor Swift concert ticket",
    price: 120,
    bg: "#efe2f6",
    art: svg(
      "#efe2f6",
      `<g transform="rotate(-10 60 60)">
        <path d="M18 42h84v12a6 6 0 0 0 0 12v12H18V66a6 6 0 0 0 0-12z" fill="#b48ad1"/>
        <path d="M80 42v36" stroke="#efe2f6" stroke-width="2" stroke-dasharray="3 3"/>
        <rect x="26" y="50" width="44" height="6" rx="3" fill="#fff" opacity=".9"/>
        <rect x="26" y="61" width="30" height="4" rx="2" fill="#fff" opacity=".6"/>
        <path d="M91 53l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#fff"/>
      </g>`,
    ),
  },
  {
    id: "boots",
    name: "Zara boots",
    price: 189,
    bg: "#f3e6d8",
    art: svg(
      "#f3e6d8",
      `<path d="M44 22h22v52c0 4 3 6 8 7l18 4c6 1 9 5 9 10v5H38l2-9V22z" fill="#6b4a36"/>
       <rect x="44" y="22" width="22" height="8" rx="2" fill="#56392a"/>
       <path d="M38 95h63v6H38z" fill="#3e2a1f"/>
       <path d="M40 101h8v-6h-8z" fill="#2c1e16"/>`,
    ),
  },
  {
    id: "bag",
    name: "Green suede shoulder bag",
    price: 395,
    bg: "#e3ecd9",
    art: svg(
      "#e3ecd9",
      `<path d="M40 50c0-18 40-18 40 0" fill="none" stroke="#5f7a45" stroke-width="5" stroke-linecap="round"/>
       <rect x="26" y="48" width="68" height="48" rx="14" fill="#7d9a5c"/>
       <path d="M26 64h68" stroke="#6a8650" stroke-width="3"/>
       <circle cx="60" cy="66" r="4" fill="#d9c27a"/>`,
    ),
  },
  {
    id: "sunglasses",
    name: "Sunglasses",
    price: 145,
    bg: "#fbe7d3",
    art: svg(
      "#fbe7d3",
      `<path d="M14 54h92" stroke="#2f2a26" stroke-width="4" stroke-linecap="round"/>
       <rect x="20" y="52" width="34" height="24" rx="11" fill="#2f2a26"/>
       <rect x="66" y="52" width="34" height="24" rx="11" fill="#2f2a26"/>
       <path d="M54 58c4-3 8-3 12 0" fill="none" stroke="#2f2a26" stroke-width="4"/>
       <path d="M26 58l8-2" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>
       <path d="M72 58l8-2" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,
    ),
  },
  {
    id: "dinner",
    name: "Musaafer dinner",
    price: 160,
    bg: "#f6dfd6",
    art: svg(
      "#f6dfd6",
      `<circle cx="60" cy="62" r="34" fill="#fff"/>
       <circle cx="60" cy="62" r="25" fill="#f3efe9"/>
       <circle cx="54" cy="60" r="10" fill="#d0763f"/>
       <circle cx="67" cy="66" r="8" fill="#e9a23b"/>
       <path d="M50 72c6 3 14 3 20 0" stroke="#7a9a4f" stroke-width="4" stroke-linecap="round" fill="none"/>
       <path d="M18 36v52M14 36v14a4 4 0 0 0 8 0V36" stroke="#a88f7c" stroke-width="3" fill="none" stroke-linecap="round"/>
       <path d="M102 36c-6 6-6 20 0 22v30" stroke="#a88f7c" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "airpods",
    name: "AirPods",
    price: 179,
    bg: "#dfe8f1",
    art: svg(
      "#dfe8f1",
      `<rect x="34" y="40" width="52" height="50" rx="16" fill="#fff"/>
       <path d="M34 58h52" stroke="#d6dde5" stroke-width="2"/>
       <rect x="56" y="64" width="8" height="3" rx="1.5" fill="#cfd6de"/>
       <path d="M46 22c-6 0-9 5-8 10 1 4 5 6 8 5v14h5V28c0-4-2-6-5-6z" fill="#fff" stroke="#d6dde5"/>
       <path d="M74 22c6 0 9 5 8 10-1 4-5 6-8 5v14h-5V28c0-4 2-6 5-6z" fill="#fff" stroke="#d6dde5"/>`,
    ),
  },
];
