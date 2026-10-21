/* Shared theme engine. Loaded in the <head> (NOT deferred) so the right
   theme is applied before the page paints - no flash of the wrong mode.

   Modes saved in localStorage "theme":
     "light" - always light
     "dark"  - always dark
     "auto"  - switch by the visitor's schedule (localStorage "themeSchedule")

   The schedule is a JSON object like {"from":"18:00","to":"06:00"}:
   darkness is used between those times. If "from" is later than "to"
   (like 18:00 -> 06:00) it is an overnight window that wraps past midnight.
   The default schedule is 18:00 to 06:00. */

/* Parse "18:30" into minutes since midnight. Returns null if invalid. */
function themeParseTime(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ""));
  if (!m) return null;
  const h = +m[1],
    min = +m[2];
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/* True if "now" (minutes since midnight) is inside the dark window. */
function themeIsDarkTime(schedule) {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const from = themeParseTime(schedule.from);
  const to = themeParseTime(schedule.to);
  if (from === null || to === null) return false;
  /* Normal window (e.g. 07:00 -> 18:00) or overnight window (18:00 -> 06:00) */
  return from <= to ? cur >= from && cur < to : cur >= from || cur < to;
}

/* Work out whether darkness should be on right now.
   Returns true, false, or null when the visitor never chose a mode. */
function themeShouldBeDark() {
  let saved = null;
  try {
    saved = localStorage.getItem("theme");
  } catch (e) { }
  if (saved === "light") return false;
  if (saved === "dark") return true;
  if (saved === "auto") {
    let s;
    try {
      s = JSON.parse(localStorage.getItem("themeSchedule") || "");
    } catch (e) { }
    if (!s) s = { from: "18:00", to: "06:00" };
    return themeIsDarkTime(s);
  }
  return null; /* no choice yet - follow the device via CSS media query */
}

/* Apply the theme to <html>. Safe to call any time (theme picker uses this). */
function applyTheme() {
  const dark = themeShouldBeDark();
  if (dark === null) {
    /* Follow the device: CSS handles it, so just clear any override */
    document.documentElement.dataset.theme = "";
  } else {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }
}

/* Run now, before the page paints */
applyTheme();
