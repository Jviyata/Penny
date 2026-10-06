/**
 * The six demo "photos" in the Talk to Penny gallery: a product photo (in /public/items)
 * plus the name and price Penny reads off it.
 */
export type DemoItem = { id: string; name: string; price: number; art: string };

export const DEMO_ITEMS: DemoItem[] = [
  { id: "ticket", name: "Taylor Swift concert ticket", price: 120, art: "/items/ticket.jpg" },
  { id: "boots", name: "Zara boots", price: 189, art: "/items/boots.jpg" },
  { id: "bag", name: "Brown suede shoulder bag", price: 395, art: "/items/bag.jpg" },
  { id: "sunglasses", name: "Sunglasses", price: 145, art: "/items/sunglasses.jpg" },
  { id: "dinner", name: "Musaafer dinner", price: 160, art: "/items/dinner.jpg" },
  { id: "airpods", name: "AirPods", price: 179, art: "/items/airpods.jpg" },
];
