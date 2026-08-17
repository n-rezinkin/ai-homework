import type { AppData, Checks, Habit } from '../types';
import { MAX_HABITS, MAX_NAME_LENGTH } from '../types';
import { isFuture, isValidKey } from './dates';

export type ParseResult =
  | { ok: true; data: AppData }
  | { ok: false; reason: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Проверка данных по схеме, а не по JSON.parse.
 *
 * Через импорт нельзя протащить состояние, которое нельзя собрать руками:
 * будущие отметки, дубли имён, имена длиннее лимита, больше 20 привычек.
 * Иначе половина правил валидации оказалась бы декоративной.
 */
export function parseAppData(raw: unknown): ParseResult {
  if (!isObject(raw)) {
    return { ok: false, reason: 'Файл не похож на данные трекера: ожидался объект.' };
  }
  if (raw.version !== 1) {
    return {
      ok: false,
      reason: `Неподдерживаемая версия данных: ${JSON.stringify(raw.version) ?? 'нет поля version'}. Поддерживается только версия 1.`,
    };
  }
  if (!Array.isArray(raw.habits)) {
    return { ok: false, reason: 'Поле habits отсутствует или не является списком.' };
  }
  if (raw.habits.length > MAX_HABITS) {
    return { ok: false, reason: `В файле больше ${MAX_HABITS} привычек — это выше лимита.` };
  }

  const habits: Habit[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const item of raw.habits) {
    if (!isObject(item)) {
      return { ok: false, reason: 'Одна из привычек не является объектом.' };
    }
    const { id, name, createdAt } = item;
    if (typeof id !== 'string' || id.length === 0) {
      return { ok: false, reason: 'У привычки отсутствует идентификатор.' };
    }
    if (seenIds.has(id)) {
      return { ok: false, reason: `Идентификатор привычки повторяется: ${id}.` };
    }
    if (typeof name !== 'string') {
      return { ok: false, reason: `У привычки ${id} название не является строкой.` };
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return { ok: false, reason: `У привычки ${id} пустое название.` };
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      return {
        ok: false,
        reason: `Название «${trimmed.slice(0, 20)}…» длиннее ${MAX_NAME_LENGTH} символов.`,
      };
    }
    const lowered = trimmed.toLocaleLowerCase('ru');
    if (seenNames.has(lowered)) {
      return { ok: false, reason: `Название повторяется: «${trimmed}».` };
    }
    if (typeof createdAt !== 'string' || !isValidKey(createdAt)) {
      return { ok: false, reason: `У привычки «${trimmed}» неверная дата создания.` };
    }
    // Руками такую привычку не завести: addHabit ставит сегодняшнюю дату.
    // Находка 6 аудита кода.
    if (isFuture(createdAt)) {
      return { ok: false, reason: `У привычки «${trimmed}» дата создания в будущем: ${createdAt}.` };
    }

    seenIds.add(id);
    seenNames.add(lowered);
    habits.push({ id, name: trimmed, createdAt });
  }

  if (!isObject(raw.checks)) {
    return { ok: false, reason: 'Поле checks отсутствует или не является объектом.' };
  }

  // Собираем через Map: присваивание checks['__proto__'] на литерале трогает
  // прототип вместо создания своего поля. Находка 7 аудита кода.
  const collected = new Map<string, string[]>();
  for (const [habitId, value] of Object.entries(raw.checks)) {
    // Осиротевшие отметки отбрасываются молча: на то, что видит человек,
    // они не влияют, а ронять из-за них весь импорт незачем.
    if (!seenIds.has(habitId)) continue;
    if (!Array.isArray(value)) {
      return { ok: false, reason: `Отметки привычки ${habitId} не являются списком.` };
    }
    const dates = new Set<string>();
    for (const date of value) {
      if (typeof date !== 'string' || !isValidKey(date)) {
        return { ok: false, reason: `Неверная дата в отметках: ${JSON.stringify(date)}.` };
      }
      if (isFuture(date)) {
        return { ok: false, reason: `Отметка в будущем: ${date}. Будущие дни отмечать нельзя.` };
      }
      dates.add(date); // повторы схлопываются
    }
    collected.set(habitId, [...dates].sort());
  }
  const checks: Checks = Object.fromEntries(collected);

  return { ok: true, data: { version: 1, habits, checks } };
}

/** Проверка названия при вводе руками. Возвращает ошибку или null. */
export function validateName(
  input: string,
  existing: readonly Habit[],
): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return 'Введите название привычки.';
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Не длиннее ${MAX_NAME_LENGTH} символов, сейчас ${trimmed.length}.`;
  }
  const lowered = trimmed.toLocaleLowerCase('ru');
  if (existing.some((h) => h.name.toLocaleLowerCase('ru') === lowered)) {
    return 'Такая привычка уже есть.';
  }
  if (existing.length >= MAX_HABITS) {
    return `Больше ${MAX_HABITS} привычек не поместится на экран.`;
  }
  return null;
}
