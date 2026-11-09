import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Accessible bottom sheet / dialog built on <dialog>. */
export function Sheet({ title, onClose, children, tall }: { title: string; onClose: () => void; children: ReactNode; tall?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className={`sheet ${tall ? 'tall' : ''}`}
      aria-label={title}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="sheet-inner">
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </dialog>
  );
}
