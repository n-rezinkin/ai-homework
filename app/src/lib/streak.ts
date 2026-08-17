import type { DateKey } from '../types';
import { addDays, fromKey, toKey, todayKey } from './dates';

/**
 * Серия — число подряд идущих отмеченных дней, заканчивающееся сегодня
 * или вчера.
 *
 * Ключевое правило из SPEC.md: неотмеченный сегодняшний день серию не рвёт.
 * День ещё не кончился — обнулять прогресс за то, что человек не успел
 * сделать зарядку к девяти утра, было бы враньём.
 *
 * Серия считается по всей истории и не зависит от того, какая неделя открыта
 * на экране, поэтому может быть длиннее семи.
 */
export function currentStreak(
  dates: readonly DateKey[],
  today: DateKey = todayKey(),
): number {
  const done = new Set(dates);
  const start = fromKey(today);
  if (!start) return 0;

  // Если сегодня не отмечено — считаем от вчера.
  let cursor = done.has(today) ? start : addDays(start, -1);
  let streak = 0;

  while (done.has(toKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Склонение для подписи: 1 день, 2 дня, 5 дней. */
export function pluralDays(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}
