import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const value = useMemo(() => {
    const toast = (message, type) => push(message, type);
    toast.dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
    return toast;
  }, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={value.dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used within ToastProvider');
  return toast;
}

function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className="card px-4 py-3 flex items-center gap-3 max-w-sm">
          <span className="text-sm">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="btn btn-ghost p-1"><X size={14}/></button>
        </div>
      ))}
    </div>
  );
}
