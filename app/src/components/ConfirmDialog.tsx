import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Куда вернуть фокус, если инициатор исчез вместе с удалённой строкой. */
  fallbackFocus?: () => HTMLElement | null;
};

/**
 * Оверлей с подтверждением.
 *
 * Фокус уходит внутрь при открытии, не выпадает по Tab и возвращается
 * на кнопку-инициатор при закрытии — иначе клавиатурный пользователь
 * теряет позицию, а требование «Esc закрывает» формально проходит
 * при недоступной модалке.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  fallbackFocus,
}: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    confirmButton.current?.focus();
    return () => {
      const target = opener.current;
      // При подтверждении удаления кнопка-инициатор исчезает вместе со строкой,
      // и focus() на отсоединённом узле роняет фокус в body — дальше Tab
      // начинается с начала страницы. Находка 3 аудита кода.
      if (target instanceof HTMLElement && target.isConnected) {
        target.focus();
        return;
      }
      fallbackFocus?.()?.focus();
    };
  }, [fallbackFocus]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = dialog.current?.querySelectorAll<HTMLElement>('button');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /*
    Портал в body — не украшательство. У `.page` стоит анимация появления,
    и её финальный кадр даёт transform: matrix(1,0,0,1,0,0) вместо none.
    Любое не-none значение transform делает элемент блоком-контейнером
    для position: fixed, поэтому оверлей затемнял только колонку страницы,
    а поля по краям оставались светлыми. Порталом это перестаёт зависеть
    от того, что происходит с предками.
  */
  return createPortal(
    <div className="overlay" onKeyDown={handleKeyDown}>
      <div
        className="dialog"
        ref={dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-text"
      >
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-text">{description}</p>
        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="button danger" ref={confirmButton} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
