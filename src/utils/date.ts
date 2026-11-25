const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WEEKDAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];
const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Bounds of the device's calendar day, as instants. */
export function getDayBounds(date: Date): { start: number; end: number } {
  return { start: addDays(date, 0).getTime(), end: addDays(date, 1).getTime() };
}

export function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDay(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** "qui 19": weekday and day of month, for lists of the coming days. */
export function formatShortDay(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}`;
}

export function formatMatchDate(isoDate: string): string {
  return `${formatDay(new Date(isoDate))} - ${formatTime(isoDate)}`;
}

export function formatRelativeSync(syncedAt: number, now: number): string {
  const minutes = Math.floor((now - syncedAt) / 60000);
  if (minutes < 1) return 'Atualizado agora';
  if (minutes < 60) return `Atualizado há ${minutes} min`;
  if (now - syncedAt < DAY_MS) {
    return `Atualizado há ${Math.floor(minutes / 60)} h`;
  }
  return `Atualizado em ${formatDay(new Date(syncedAt))}`;
}

/** The top line of a day in the week strip: "Ontem", "Hoje" or "Qui". */
export function formatStripDay(date: Date, offset: number): string {
  if (offset === 0) return 'Hoje';
  if (offset === -1) return 'Ontem';
  const short = WEEKDAYS[date.getDay()];
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** "quinta-feira, 26/11", for screen readers. */
export function formatLongDay(date: Date): string {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
