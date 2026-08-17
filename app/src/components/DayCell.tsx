import { humanDate, weekdayShort } from '../lib/dates';

type Props = {
  date: Date;
  habitName: string;
  checked: boolean;
  isToday: boolean;
  isFuture: boolean;
  /** Roving tabindex: в таб-порядке стоит ровно одна ячейка сетки. */
  tabbable: boolean;
  onToggle: () => void;
  registerRef: (element: HTMLButtonElement | null) => void;
};

export function DayCell({
  date,
  habitName,
  checked,
  isToday,
  isFuture,
  tabbable,
  onToggle,
  registerRef,
}: Props) {
  const label = `${habitName}, ${weekdayShort(date)} ${humanDate(date)}`;
  const state = isFuture ? 'день ещё не наступил' : checked ? 'выполнено' : 'не отмечено';

  return (
    <div role="gridcell" className="cell-wrap">
      <button
        ref={registerRef}
        type="button"
        className="cell"
        data-grid-item
        data-checked={checked || undefined}
        data-today={isToday || undefined}
        data-future={isFuture || undefined}
        /*
          Именно aria-disabled, а не disabled: на disabled-кнопку нельзя поставить
          фокус, и навигация стрелками об неё спотыкается — фокус пропадает.
          Проверка это поймала, до неё ячейки были disabled.
        */
        aria-disabled={isFuture || undefined}
        aria-pressed={isFuture ? undefined : checked}
        aria-label={`${label}: ${state}`}
        tabIndex={tabbable ? 0 : -1}
        onClick={() => {
          if (isFuture) return;
          onToggle();
        }}
      >
        {/*
          На узких экранах шапка сетки скрыта, поэтому день подписывается прямо
          в ячейке — иначе непонятно, какая клетка какой день. Нашлось глазами
          на скриншоте 360px, автоматическая проверка это пропустила.
        */}
        <span aria-hidden="true" className="cell-day">
          {weekdayShort(date)}
        </span>
        <span aria-hidden="true" className="cell-mark" />
      </button>
    </div>
  );
}
