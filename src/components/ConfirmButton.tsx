import { useEffect, useState, type ReactNode } from 'react';

/** Two-tap confirm: first tap arms the button, second tap acts. No browser dialogs needed. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel,
  className = 'btn',
  ariaLabel,
}: {
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  confirmLabel: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button
      className={`${className} ${armed ? 'armed' : ''}`}
      aria-label={armed ? confirmLabel : ariaLabel}
      onClick={() => {
        if (armed) {
          setArmed(false);
          void onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
