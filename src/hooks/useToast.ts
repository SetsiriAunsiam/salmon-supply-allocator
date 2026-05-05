import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => {
    const id = String(++nextId);
    const duration = toast.duration ?? 3500;
    setToasts(prev => [...prev, { ...toast, id, duration }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return { toasts, show, dismiss };
}
