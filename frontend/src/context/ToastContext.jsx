import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const ToastContext = createContext(null);

let nextToastId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = nextToastId++;

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ]);

      window.setTimeout(() => {
        setToasts((current) =>
          current.filter((toast) => toast.id !== id),
        );
      }, duration);
    },
    [],
  );

  const dismissToast = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    );
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        dismissToast,
      }}
    >
      {children}

      <div
        className="toast-container"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <span>{toast.message}</span>

            <button
              type="button"
              className="toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider",
    );
  }

  return context;
}
