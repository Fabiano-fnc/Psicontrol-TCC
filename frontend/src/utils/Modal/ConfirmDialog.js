import React, { useEffect, useRef } from "react";
import { closeOnBackdrop, useEscapeKey } from "./useDismiss";

const tones = {
  danger: {
    icon: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
    badge: "bg-erro/10 text-erro ring-erro/5",
    button: "bg-erro hover:bg-erro/90",
  },
  warning: {
    icon: "M12 4 2.5 20h19L12 4ZM12 10v4M12 17h.01",
    badge: "bg-aviso/15 text-aviso ring-aviso/5",
    button: "bg-primaria hover:opacity-90",
  },
  primary: {
    icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 9 3 3 5-6",
    badge: "bg-clara3 text-primaria ring-clara3/40",
    button: "bg-primaria hover:opacity-90",
  },
};

// Painel de confirmação padrão do sistema.
// tone: "danger" (ação destrutiva), "warning" ou "primary"; icon sobrescreve o ícone do tom.
const ConfirmDialog = ({
  title,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  icon,
  onConfirm,
  onCancel,
}) => {
  const style = tones[tone] || tones.primary;
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEscapeKey(true, onCancel);

  // Em ações destrutivas o foco inicial fica em "Cancelar", para um Enter
  // acidental não apagar nada
  useEffect(() => {
    (tone === "danger" ? cancelRef : confirmRef).current?.focus();
  }, [tone]);

  return (
    <div
      onClick={closeOnBackdrop(onCancel)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-texto1/30 p-4 backdrop-blur-[4px]"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-[400px] animate-toast-in rounded-2xl border border-cinza9 bg-bg1 p-6 shadow-dropShadow"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-8 ${style.badge}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d={icon || style.icon} />
            </svg>
          </span>
          <div className="min-w-0 pt-1">
            <h2
              id="confirm-dialog-title"
              className="font-ubuntu text-lg font-bold tracking-tight text-texto1"
            >
              {title}
            </h2>
            {children && (
              <div className="mt-1.5 text-sm leading-relaxed text-texto2">
                {children}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-10 rounded-full border border-cinza9 bg-bg1 px-5 text-sm font-semibold text-texto2 transition hover:bg-clara4 focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`h-10 rounded-full px-5 text-sm font-semibold text-white shadow-card transition focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 ${style.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
