const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terca',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sabado',
];

const MONTHS = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function formatTodayDate(): string {
  const now = new Date();
  return `${now.getDate()} de ${MONTHS[now.getMonth()]}`;
}

export function formatTodayLong(): string {
  const now = new Date();
  return `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
}

export function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

export function formatMatchDateTime(dateStr: string, hour: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  const weekday = WEEKDAYS[date.getDay()];
  const shortDate = `${dayStr}/${monthStr}/${yearStr}`;
  return `${weekday}, ${shortDate} - ${formatHour(hour)}`;
}

export function formatHour(hour: string): string {
  return hour.replace('h', ':');
}
