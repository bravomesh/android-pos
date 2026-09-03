/**
 * Business-day helpers.
 *
 * Timestamps are stored as UTC ISO strings, so `DATE(created_at)` returns the
 * UTC day. A shop does not trade in UTC: in Nairobi (UTC+3) an evening sale
 * still lands on the right UTC day, but anywhere west of Greenwich the
 * evening trade falls into tomorrow's figures, and the "today" the dashboard
 * asks for is not the day the cashier is standing in.
 *
 * Every daily total therefore compares local days on both sides: the SQL
 * shifts the stored UTC timestamp into device-local time before taking its
 * date, and the bounds are built from the device's local calendar.
 */

const pad = (value) => String(value).padStart(2, '0');

/**
 * Local calendar date as YYYY-MM-DD.
 */
export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Local date N days before today, for "last 7 days" style ranges.
 */
export const localDayBefore = (days, from = new Date()) => {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return localDay(date);
};

/**
 * SQLite modifier turning a stored UTC timestamp into local time.
 *
 * Built from Date.getTimezoneOffset(), so it is a number this module
 * produced — never user input — and safe to inline into SQL.
 */
export const localOffsetModifier = () => {
  const minutes = -new Date().getTimezoneOffset();
  return `'${minutes >= 0 ? '+' : '-'}${Math.abs(minutes)} minutes'`;
};

/**
 * SQL expression for "the local calendar day this UTC timestamp falls on".
 *
 * Use for created_at/updated_at, which are written as UTC ISO strings.
 * Do NOT use for spent_at or payed_at: those hold a date the user picked in
 * their own calendar already, and shifting them would move them a day.
 */
export const localDayOf = (column) => `DATE(${column}, ${localOffsetModifier()})`;
