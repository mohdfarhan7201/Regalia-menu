// Single source of truth for the restaurant's wall-clock timezone. Daily revenue,
// "today" boundaries, and the hourly heatmap must all bucket on THIS zone, not the
// server's (Vercel runs UTC) — otherwise orders land in the wrong day/hour.
// Override with APP_TZ env if the venue isn't in India.
export const APP_TZ = process.env.APP_TZ || "Asia/Kolkata";

// Minutes `tz` is ahead of UTC at the given instant (handles DST for zones that
// have it; India does not). Used to convert a local wall-clock day to a UTC range.
function tzOffsetMinutes(at: Date, tz: string): number {
  const local = new Date(at.toLocaleString("en-US", { timeZone: tz }));
  return Math.round((local.getTime() - at.getTime()) / 60000);
}

// "YYYY-MM-DD" in the app timezone for a given instant (default: now).
export function todayInTz(tz: string = APP_TZ, at: Date = new Date()): string {
  return at.toLocaleDateString("en-CA", { timeZone: tz }); // en-CA → ISO-ish
}

// UTC instant for 00:00:00 of the given local day (`YYYY-MM-DD`) in `tz`.
export function startOfDayTz(ymd: string, tz: string = APP_TZ): Date {
  const asUtcMidnight = new Date(`${ymd}T00:00:00.000Z`);
  const off = tzOffsetMinutes(asUtcMidnight, tz);
  return new Date(asUtcMidnight.getTime() - off * 60000);
}

// UTC instant for the END of the given local day (23:59:59.999) in `tz`.
export function endOfDayTz(ymd: string, tz: string = APP_TZ): Date {
  const start = startOfDayTz(ymd, tz);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}
