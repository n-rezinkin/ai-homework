/** Дата в локальном календаре, строка вида YYYY-MM-DD. */
export type DateKey = string;

export type Habit = {
  id: string;
  name: string;
  /** Справочное поле: не ограничивает, какие дни можно отмечать. */
  createdAt: DateKey;
};

/** Отметки: id привычки → список отмеченных дней. */
export type Checks = Record<string, DateKey[]>;

export type AppData = {
  version: 1;
  habits: Habit[];
  checks: Checks;
};

export type Theme = 'light' | 'dark' | 'system';

/** Чем закончилось чтение хранилища при старте. */
export type LoadResult =
  | { kind: 'ok'; data: AppData }
  | { kind: 'empty' }
  | { kind: 'broken'; reason: string };

export const MAX_HABITS = 20;
export const MAX_NAME_LENGTH = 40;
