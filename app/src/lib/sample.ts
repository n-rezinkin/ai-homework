import type { AppData, DateKey } from '../types';
import { addDays, toKey } from './dates';

/**
 * Пример данных строится ОТНОСИТЕЛЬНО сегодняшней даты.
 *
 * Жёстко зашитые даты сделали бы критерии приёмки про серии проверяемыми
 * ровно один день в году, а часть отметок оказалась бы в будущем —
 * то есть в состоянии, которое руками собрать нельзя.
 */
export function buildSample(): AppData {
  const today = new Date();

  // Смещения в днях назад. Подобраны так, чтобы получились разные серии:
  // длинная непрерывная, порванная вчера, пустая на этой неделе.
  const plan: Array<{ name: string; offsets: number[] }> = [
    { name: 'Зарядка', offsets: [0, 1, 2, 3, 4, 5, 6, 7] },
    { name: 'Читать 20 страниц', offsets: [1, 2, 3, 5, 6, 9] },
    { name: 'Английский', offsets: [2, 3, 4, 8, 9, 10] },
    { name: 'Без сахара', offsets: [0, 1, 4, 7, 11] },
    { name: 'Прогулка 30 минут', offsets: [1, 3, 5, 7, 9, 11, 13] },
    { name: 'Вода 2 литра', offsets: [0, 2, 6] },
    { name: 'Лечь до полуночи', offsets: [] },
  ];

  const habits = plan.map((item, index) => {
    const oldest = item.offsets.length > 0 ? Math.max(...item.offsets) : 0;
    return {
      id: `sample-${index + 1}`,
      name: item.name,
      createdAt: toKey(addDays(today, -oldest)),
    };
  });

  const checks: Record<string, DateKey[]> = {};
  plan.forEach((item, index) => {
    const id = `sample-${index + 1}`;
    checks[id] = item.offsets
      .map((offset) => toKey(addDays(today, -offset)))
      .sort();
  });

  return { version: 1, habits, checks };
}
