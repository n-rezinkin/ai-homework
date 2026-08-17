import type { ReactElement } from 'react';

type Props = {
  tone: 'error' | 'warning' | 'success';
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
};

/**
 * Наложение поверх текущего состояния экрана.
 *
 * Живёт в aria-live области (см. App): без неё ошибка импорта для скринридера
 * просто не существует.
 */
const TONE_ICON: Record<Props['tone'], ReactElement> = {
  error: (
    <path d="M12 8v5m0 3.5v.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  warning: (
    <path d="M12 8v5m0 3.5v.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  success: <path d="M20 6 9 17l-5-5" />,
};

export function Banner({ tone, text, actionLabel, onAction, onDismiss }: Props) {
  return (
    <div className="banner" data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="banner-lead">
        <svg
          className="banner-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {TONE_ICON[tone]}
        </svg>
        <p className="banner-text">{text}</p>
      </div>
      <div className="banner-actions">
        {actionLabel && onAction && (
          <button type="button" className="button ghost small" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        <button type="button" className="button ghost small" onClick={onDismiss}>
          Понятно
        </button>
      </div>
    </div>
  );
}
