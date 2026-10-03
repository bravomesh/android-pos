const pad = (n) => String(n).padStart(2, '0');

export function todayLocalISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function yesterdayLocalISO(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return todayLocalISO(d);
}

export function msUntilNext0030(now = new Date()) {
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    30,
    0
  );
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

export function formatDisplay(d) {
  return `${todayLocalISO(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
