import { useEffect, useMemo, useRef, useState } from 'react';
import type { Habit } from '../types';
import { humanDate, isFuture, toKey, weekdayShort } from '../lib/dates';
import { currentStreak, pluralDays } from '../lib/streak';
import { DayCell } from './DayCell';

type Props = {
  habits: Habit[];
  checks: Record<string, string[]>;
  days: Date[];
  today: string;
  onToggle: (habitId: string, dateKey: string) => void;
  onRequestDelete: (habit: Habit) => void;
};

/**
 * Сетка недели.
 *
 * Клавиатура: вся сетка — ОДНА остановка Tab, внутри перемещение стрелками
 * (roving tabindex). Кнопка удаления — последняя колонка той же модели,
 * а не отдельная остановка: иначе «одна остановка Tab» превращается
 * в одну ячейку плюс двадцать корзин (находка 2 аудита кода).
 *
 * Будущие дни пропускаются при навигации и никогда не становятся tabbable —
 * SPEC требует, чтобы они не получали фокус (находка 1 аудита кода).
 */
export function WeekGrid({
  habits,
  checks,
  days,
  today,
  onToggle,
  onRequestDelete,
}: Props) {
  const deleteCol = days.length;

  // Колонки, на которые можно поставить фокус: прошедшие дни + колонка удаления.
  const allowedCols = useMemo(() => {
    const cols = days
      .map((day, index) => (isFuture(toKey(day), today) ? -1 : index))
      .filter((index) => index >= 0);
    cols.push(deleteCol);
    return cols;
  }, [days, today, deleteCol]);

  const [focus, setFocus] = useState({ row: 0, col: allowedCols[0] ?? 0 });
  const cells = useRef<Array<Array<HTMLButtonElement | null>>>([]);
  const shouldFocus = useRef(false);

  // Строк могло стать меньше, а колонка — оказаться будущей после смены недели.
  useEffect(() => {
    setFocus((prev) => {
      const row = Math.min(prev.row, Math.max(habits.length - 1, 0));
      const col = allowedCols.includes(prev.col) ? prev.col : (allowedCols[0] ?? 0);
      return row === prev.row && col === prev.col ? prev : { row, col };
    });
  }, [habits.length, allowedCols]);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    cells.current[focus.row]?.[focus.col]?.focus();
  }, [focus]);

  function moveRow(delta: number) {
    setFocus((prev) => ({
      ...prev,
      row: clamp(prev.row + delta, habits.length - 1),
    }));
    shouldFocus.current = true;
  }

  function moveCol(delta: number) {
    setFocus((prev) => {
      const at = allowedCols.indexOf(prev.col);
      const next = clamp(at + delta, allowedCols.length - 1);
      return { ...prev, col: allowedCols[next] ?? prev.col };
    });
    shouldFocus.current = true;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Стрелки перехватываются только внутри управляемых элементов сетки.
    if (!(event.target as HTMLElement).closest('[data-grid-item]')) return;

    switch (event.key) {
      case 'ArrowRight': moveCol(1); break;
      case 'ArrowLeft': moveCol(-1); break;
      case 'ArrowDown': moveRow(1); break;
      case 'ArrowUp': moveRow(-1); break;
      case 'Home':
        setFocus((p) => ({ ...p, col: allowedCols[0] ?? p.col }));
        shouldFocus.current = true;
        break;
      case 'End':
        setFocus((p) => ({ ...p, col: allowedCols[allowedCols.length - 1] ?? p.col }));
        shouldFocus.current = true;
        break;
      default: return;
    }
    event.preventDefault();
  }

  return (
    <div className="grid" role="grid" aria-label="Привычки по дням недели" onKeyDown={handleKeyDown}>
      <div className="grid-head" role="row">
        <span className="col-name" role="columnheader">Привычка</span>
        {days.map((day) => (
          <span key={toKey(day)} role="columnheader" className="col-day" data-today={toKey(day) === today || undefined}>
            <span className="col-day-name">{weekdayShort(day)}</span>
            <span className="col-day-num">{day.getDate()}</span>
            <span className="visually-hidden">{humanDate(day)}</span>
          </span>
        ))}
        <span className="col-streak" role="columnheader">Серия</span>
        <span className="col-actions" role="columnheader"><span className="visually-hidden">Действия</span></span>
      </div>

      {habits.map((habit, row) => {
        const done = checks[habit.id] ?? [];
        const streak = currentStreak(done, today);
        return (
          <div className="grid-row" role="row" key={habit.id}>
            <span className="col-name" role="rowheader">{habit.name}</span>
            {days.map((day, col) => {
              const key = toKey(day);
              return (
                <DayCell
                  key={key}
                  date={day}
                  habitName={habit.name}
                  checked={done.includes(key)}
                  isToday={key === today}
                  isFuture={isFuture(key, today)}
                  tabbable={row === focus.row && col === focus.col}
                  onToggle={() => onToggle(habit.id, key)}
                  registerRef={(element) => {
                    cells.current[row] ??= [];
                    cells.current[row][col] = element;
                  }}
                />
              );
            })}
            <span className="col-streak" role="gridcell">
              <span className="streak" data-zero={streak === 0 || undefined}>
                {streak}
                <span className="visually-hidden"> {pluralDays(streak)} подряд</span>
              </span>
            </span>
            <span className="col-actions" role="gridcell">
              <button
                type="button"
                className="icon-button"
                data-grid-item
                tabIndex={row === focus.row && focus.col === deleteCol ? 0 : -1}
                ref={(element) => {
                  cells.current[row] ??= [];
                  cells.current[row][deleteCol] = element;
                }}
                onClick={() => onRequestDelete(habit)}
                aria-label={`Удалить привычку «${habit.name}»`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), Math.max(max, 0));
}
