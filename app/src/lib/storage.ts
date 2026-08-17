import type { AppData, LoadResult, Theme } from '../types';
import { parseAppData } from './schema';

const DATA_KEY = 'habit-tracker/v1';
const BROKEN_KEY = 'habit-tracker/v1.broken';
const THEME_KEY = 'habit-tracker/theme';

export const EMPTY_DATA: AppData = { version: 1, habits: [], checks: {} };

/**
 * Чтение при старте. Экран не должен падать ни при каких данных в хранилище,
 * поэтому любая проблема превращается в LoadResult, а не в исключение.
 */
export function loadData(): LoadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DATA_KEY);
  } catch {
    // Приватный режим или отключённое хранилище.
    return { kind: 'broken', reason: 'Браузер не даёт доступ к локальному хранилищу.' };
  }
  if (raw === null) return { kind: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    keepBroken(raw);
    return { kind: 'broken', reason: 'Сохранённые данные не читаются как JSON.' };
  }

  const result = parseAppData(parsed);
  if (!result.ok) {
    keepBroken(raw);
    return { kind: 'broken', reason: result.reason };
  }
  return { kind: 'ok', data: result.data };
}

/** Диагностический след. В интерфейсе не показывается, в экспорт не идёт. */
function keepBroken(raw: string): void {
  try {
    localStorage.setItem(BROKEN_KEY, raw);
  } catch {
    // Не смогли сохранить след — не повод ломать запуск.
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    // Молча глотать нельзя: человек решит, что отметка сохранилась.
    return false;
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(BROKEN_KEY);
  } catch {
    // Нечего делать: хранилище недоступно.
  }
}

/** Тема живёт отдельным ключом, чтобы импорт чужого файла её не менял. */
export function loadTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Падать из-за темы точно не стоит.
  }
  return 'system';
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // См. выше.
  }
}
