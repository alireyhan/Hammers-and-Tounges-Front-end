/**
 * Local datetime strings for <input type="datetime-local" /> (YYYY-MM-DDTHH:mm).
 * Do not use toISOString() — it is UTC and breaks min/value in the user's timezone.
 */
export function toDateTimeLocalString(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Validate create/update event schedule (browser-local datetime strings). */
export function validateEventSchedule(startTimeLocal, endTimeLocal) {
  if (!startTimeLocal || !endTimeLocal) {
    return { ok: false, message: "Please set start and end date/time." };
  }
  const start = new Date(startTimeLocal);
  const end = new Date(endTimeLocal);
  const now = new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, message: "Invalid date/time." };
  }
  if (start < now) {
    return { ok: false, message: "Start time cannot be in the past." };
  }
  if (end <= start) {
    return { ok: false, message: "End time must be after the start time." };
  }
  return { ok: true };
}
