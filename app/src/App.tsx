import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppData, Habit, Theme } from './types';
import { addDays, fromKey, startOfWeek, todayKey, toKey, weekDays, weekLabel } from './lib/dates';
import { parseAppData } from './lib/schema';
import { buildSample } from './lib/sample';
import { EMPTY_DATA, clearData, loadData, loadTheme, saveData, saveTheme } from './lib/storage';
import { AddHabitForm } from './components/AddHabitForm';
import { Banner } from './components/Banner';
import { ConfirmDialog } from './components/ConfirmDialog';
import { EmptyState } from './components/EmptyState';
import { Toolbar } from './components/Toolbar';
import { WeekGrid } from './components/WeekGrid';

type BannerState = {
  tone: 'error' | 'warning' | 'success';
  text: string;
  actionLabel?: string;
  action?: () => void;
};

const initial = loadData();

export default function App() {
  const [data, setData] = useState<AppData>(
    initial.kind === 'ok' ? initial.data : EMPTY_DATA,
  );
  const [banner, setBanner] = useState<BannerState | null>(
    initial.kind === 'broken'
      ? {
          tone: 'warning',
          text: `Сохранённые данные не удалось прочитать: ${initial.reason} Экран открыт пустым. Прежнее содержимое осталось в хранилище — если оно было ценным, достаньте его через консоль по ключу habit-tracker/v1.broken.`,
          actionLabel: 'Сбросить данные',
          action: () => clearData(),
        }
      : null,
  );
  const [today, setToday] = useState(todayKey);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const shownWeek = useRef(toKey(startOfWeek(new Date())));

  // Сутки могут смениться, пока вкладка открыта: пересчитываем при возврате
  // к ней, иначе экран застынет на дате загрузки.
  useEffect(() => {
    function refresh() {
      const now = todayKey();
      setToday((prev) => (prev === now ? prev : now));
    }
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  /*
    Если вкладка провисела до понедельника, «сегодня» пересчитывается, а сетка
    оставалась на прошлой неделе: подсвечивать было нечего, бейдж «текущая»
    пропадал. Двигаем неделю только если человек смотрел на ту, что была
    текущей, — уводить его с намеренно открытой прошлой недели нельзя.
    Находка 4 аудита кода.
  */
  useEffect(() => {
    const actual = toKey(startOfWeek(fromKey(today) ?? new Date()));
    if (shownWeek.current === actual) return;
    const wasOnCurrent = toKey(weekStart) === shownWeek.current;
    shownWeek.current = actual;
    if (wasOnCurrent) setWeekStart(startOfWeek(fromKey(today) ?? new Date()));
  }, [today, weekStart]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  const update = useCallback((next: AppData) => {
    setData(next);
    if (!saveData(next)) {
      setBanner({
        tone: 'error',
        text: 'Не удалось сохранить: браузер отказал в записи в локальное хранилище. Изменение видно на экране, но пропадёт после перезагрузки.',
      });
    }
  }, []);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const currentWeekStart = useMemo(
    () => startOfWeek(fromKey(today) ?? new Date()),
    [today],
  );
  const isCurrentWeek = toKey(weekStart) >= toKey(currentWeekStart);

  function toggleCheck(habitId: string, dateKey: string) {
    const done = data.checks[habitId] ?? [];
    const next = done.includes(dateKey)
      ? done.filter((item) => item !== dateKey)
      : [...done, dateKey].sort();
    update({ ...data, checks: { ...data.checks, [habitId]: next } });
  }

  function addHabit(name: string) {
    const habit: Habit = {
      id: `h${Date.now().toString(36)}`,
      name,
      createdAt: today,
    };
    update({ ...data, habits: [...data.habits, habit] });
  }

  function deleteHabit(habit: Habit) {
    const { [habit.id]: _removed, ...restChecks } = data.checks;
    update({
      ...data,
      habits: data.habits.filter((item) => item.id !== habit.id),
      checks: restChecks,
    });
    setPendingDelete(null);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habits-${today}.json`;
    link.click();
    // Освобождать сразу после click() — известная гонка: в части браузеров
    // скачивание не успевает стартовать. Находка 8 аудита кода.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function importData(file: File) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setBanner({ tone: 'error', text: 'Файл не читается как JSON. Данные на экране не изменились.' });
      return;
    }
    const result = parseAppData(parsed);
    if (!result.ok) {
      // Данные НЕ трогаем и не предлагаем сброс: снести валидные привычки
      // в ответ на чужой файл — ловушка для пользователя.
      setBanner({ tone: 'error', text: `Файл не подходит: ${result.reason} Данные на экране не изменились.` });
      return;
    }
    update(result.data);
    setBanner({ tone: 'success', text: `Загружено привычек: ${result.data.habits.length}.` });
  }

  const hasHabits = data.habits.length > 0;

  return (
    <div className="page">
      <header className="header">
        <div className="title-block">
          <h1>Неделя привычек</h1>
          <p className="subtitle">Отмечайте дни и следите, где серия держится.</p>
        </div>
        <Toolbar theme={theme} onThemeChange={setTheme} onExport={exportData} onImport={importData} />
      </header>

      {/* Без внешнего aria-live: у баннера уже есть role alert/status,
          вложение давало скринридеру двойной анонс. Находка 9 аудита кода. */}
      <div className="live-region">
        {banner && (
          <Banner
            tone={banner.tone}
            text={banner.text}
            actionLabel={banner.actionLabel}
            onAction={
              banner.action
                ? () => {
                    banner.action?.();
                    setBanner(null);
                  }
                : undefined
            }
            onDismiss={() => setBanner(null)}
          />
        )}
      </div>

      <main className="content">
        <AddHabitForm habits={data.habits} onAdd={addHabit} inputRef={addInput} />

        {hasHabits ? (
          <>
            <nav className="week-nav" aria-label="Выбор недели">
              <button
                type="button"
                className="button ghost small"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
              >
                ← Прошлая
              </button>
              <span className="week-label">
                {weekLabel(weekStart)}
                {isCurrentWeek && <span className="badge">текущая</span>}
              </span>
              <button
                type="button"
                className="button ghost small"
                disabled={isCurrentWeek}
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                Следующая →
              </button>
            </nav>

            <WeekGrid
              habits={data.habits}
              checks={data.checks}
              days={days}
              today={today}
              onToggle={toggleCheck}
              onRequestDelete={setPendingDelete}
            />
            <p className="hint">
              Серия считается по всей истории и не зависит от выбранной недели.
              В сетке работают стрелки, пробел и Enter.
            </p>
          </>
        ) : (
          <EmptyState onFillSample={() => update(buildSample())} />
        )}
      </main>

      {pendingDelete && (
        <ConfirmDialog
          title="Удалить привычку?"
          description={`«${pendingDelete.name}» исчезнет вместе со всеми отметками. Отменить это будет нельзя.`}
          confirmLabel="Удалить"
          onConfirm={() => deleteHabit(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
          fallbackFocus={() => addInput.current}
        />
      )}
    </div>
  );
}
