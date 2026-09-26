import React, { useCallback, useEffect, useState } from "react";
import { subscribe } from "./notify";

const DURATION_MS = 4000;
const MAX_VISIBLE = 3;

const styles = {
  success: { bar: "border-l-sucesso", icon: "bg-sucesso", label: "Sucesso" },
  error: { bar: "border-l-erro", icon: "bg-erro", label: "Erro" },
  info: { bar: "border-l-primaria", icon: "bg-primaria", label: "Aviso" },
};

const icons = {
  success: <path d="M5 13l4 4L19 7" />,
  error: <path d="M6 6l12 12M18 6L6 18" />,
  info: <path d="M12 8h.01M11 12h1v5h1" />,
};

const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(
    () =>
      subscribe((toast) => {
        setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), toast]);
        setTimeout(() => dismiss(toast.id), DURATION_MS);
      }),
    [dismiss]
  );

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))] md:left-auto md:items-end"
    >
      {toasts.map((toast) => {
        const style = styles[toast.type] || styles.info;
        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border border-l-4 border-cinza9 bg-white p-4 shadow-card ${style.bar}`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${style.icon}`}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icons[toast.type] || icons.info}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-texto1">{style.label}</p>
              <p className="mt-0.5 break-words text-sm text-texto2">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md p-1 text-texto3 hover:bg-clara4 hover:text-texto1"
              aria-label="Fechar notificação"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
