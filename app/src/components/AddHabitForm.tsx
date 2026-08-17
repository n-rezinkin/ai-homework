import { useId, useState } from 'react';
import type { RefObject } from 'react';
import type { Habit } from '../types';
import { MAX_NAME_LENGTH } from '../types';
import { validateName } from '../lib/schema';

type Props = {
  habits: Habit[];
  onAdd: (name: string) => void;
  /** Нужен, чтобы вернуть фокус после удаления привычки. */
  inputRef?: RefObject<HTMLInputElement | null>;
};

export function AddHabitForm({ habits, onAdd, inputRef }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validateName(value, habits);
    if (problem) {
      setError(problem);
      return;
    }
    onAdd(value.trim());
    setValue('');
    setError(null);
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={inputId}>Новая привычка</label>
        <input
          ref={inputRef}
          id={inputId}
          className="input"
          value={value}
          maxLength={MAX_NAME_LENGTH * 2}
          placeholder="Например, зарядка"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
        />
        {/* Ошибка рядом с полем и в live-области: молча подсветить рамку мало. */}
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      </div>
      <button type="submit" className="button primary">
        Добавить
      </button>
    </form>
  );
}
