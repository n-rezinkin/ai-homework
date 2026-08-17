type Props = {
  onFillSample: () => void;
};

export function EmptyState({ onFillSample }: Props) {
  return (
    <div className="empty">
      <svg className="empty-art" width="96" height="40" viewBox="0 0 96 40" fill="none" aria-hidden="true">
        <rect x="1" y="10" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <rect x="25" y="10" width="18" height="18" rx="4" fill="currentColor" />
        <rect x="49" y="10" width="18" height="18" rx="4" fill="currentColor" />
        <rect x="73" y="10" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path d="M34 19v0M58 19v0" stroke="var(--panel)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h2>Пока пусто</h2>
      <p>
        Заведите первую привычку — и она появится строкой в сетке недели.
        Отмечать можно любой прошедший день, в том числе задним числом.
      </p>
      <button type="button" className="button ghost" onClick={onFillSample}>
        Заполнить примером
      </button>
    </div>
  );
}
