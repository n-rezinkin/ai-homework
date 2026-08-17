import type { DateKey } from '../types';

/**
 * Ключ даты из локальных компонент.
 *
 * Намеренно НЕ через toISOString: он отдаёт дату по UTC, и для всех, кто
 * не в нулевом поясе, «сегодня» уезжает на день. Запрет зафиксирован в SPEC.md.
 */
export function toKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): DateKey {
  return toKey(new Date());
}

/** Разбор ключа в локальную дату. Возвращает null, если даты не существует. */
export function fromKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(year, month - 1, day);
  // Отсекает 2026-02-30 и 2026-13-01: конструктор молча переносит их вперёд.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isValidKey(key: string): boolean {
  return fromKey(key) !== null;
}

/**
 * Сдвиг на дни через конструктор Date, а не прибавлением миллисекунд:
 * при переходе на летнее время сутки не равны 24 часам.
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Понедельник недели, в которую попадает дата. */
export function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 — воскресенье
  const shift = day === 0 ? -6 : 1 - day;
  return addDays(date, shift);
}

/** Семь дней недели от понедельника. */
export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isFuture(key: DateKey, today: DateKey = todayKey()): boolean {
  return key > today; // формат YYYY-MM-DD сравнивается лексикографически
}

const WEEKDAY_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function weekdayShort(date: Date): string {
  const day = date.getDay();
  return WEEKDAY_SHORT[day === 0 ? 6 : day - 1];
}

/** «12 августа» — для доступных имён и подписей. */
export function humanDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

/** «11–17 августа» или «29 июня — 5 июля» для заголовка недели. */
export function weekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.getDate()}–${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]}`;
  }
  return `${humanDate(weekStart)} — ${humanDate(end)}`;
}
