import { memo } from 'react';
import { type Toast, type ToastType } from '../hooks/useToast';

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ICON: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLE: Record<ToastType, { card: string; icon: string; bar: string }> = {
  success: { card: 'border-emerald-200 bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-400' },
  error:   { card: 'border-red-200 bg-red-50',         icon: 'bg-red-100 text-red-600',         bar: 'bg-red-400' },
  warning: { card: 'border-amber-200 bg-amber-50',     icon: 'bg-amber-100 text-amber-600',     bar: 'bg-amber-400' },
  info:    { card: 'border-blue-200 bg-blue-50',       icon: 'bg-blue-100 text-blue-600',       bar: 'bg-blue-400' },
};

export default memo(function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-100 flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(toast => {
        const s = STYLE[toast.type];
        return (
          <div
            key={toast.id}
            className={`toast-enter pointer-events-auto rounded-xl border shadow-lg overflow-hidden ${s.card}`}
          >
            {/* Body */}
            <div className="flex items-start gap-3 px-4 py-3">
              <span className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${s.icon}`}>
                {ICON[toast.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-gray-600 mt-0.5 leading-snug">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-black/10">
              <div
                className={`h-full toast-progress ${s.bar}`}
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});
