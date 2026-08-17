import { useRef } from 'react';
import type { Theme } from '../types';

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'system', label: 'Как в системе' },
];

export function Toolbar({ theme, onThemeChange, onExport, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="toolbar">
      <div className="theme-switch" role="group" aria-label="Оформление">
        {THEMES.map((item) => (
          <button
            key={item.value}
            type="button"
            className="chip"
            data-active={theme === item.value || undefined}
            aria-pressed={theme === item.value}
            onClick={() => onThemeChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="data-actions">
        <button type="button" className="button ghost small" onClick={onExport}>
          <svg className="btn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
          Выгрузить
        </button>
        <button
          type="button"
          className="button ghost small"
          onClick={() => fileInput.current?.click()}
        >
          <svg className="btn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
          Загрузить
        </button>
        {/* Настоящий input прячем: своя кнопка выглядит одинаково во всех браузерах. */}
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          aria-label="Файл с данными трекера"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
            // Сброс — иначе повторный выбор того же файла не вызовет событие.
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
