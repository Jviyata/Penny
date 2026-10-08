/**
 * A calendar event for one of Penny's savings reminders. iPhone opens it straight in Calendar.
 * GET /api/reminder?name=Zara%20boots&amount=94&date=2026-11-01
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") ?? "your goal").replace(/[\r\n\;,]/g, " ").slice(0, 60);
  const amount = Math.max(0, Math.round(Number(url.searchParams.get("amount")) || 0));
  const date = url.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Bad date", { status: 400 });

  const day = date.replace(/-/g, "");
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const title = `Set aside $${amount} for ${name}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SpendQ//Penny//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${day}-${amount}-${name.replace(/\W+/g, "")}@spendq`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Penny's reminder: set aside $${amount} for ${name} today. Open SpendQ and tap Set aside.`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${title}`,
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="penny-reminder.ics"`,
    },
  });
}
