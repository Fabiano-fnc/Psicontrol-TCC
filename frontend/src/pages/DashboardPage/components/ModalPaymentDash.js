import React, { useState } from "react";
import { notify } from "../../../utils/notification/notify";
import { closeOnBackdrop, useEscapeKey } from "../../../utils/Modal/useDismiss";
import { formatBRL } from "../../../utils/format/format";
import { PAYMENT_METHODS } from "../../../utils/format/paymentMethods";

const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const digitsToValue = (digits) => (parseInt(digits || "0", 10) || 0) / 100;

/**
 * Registrar pagamento do mês.
 * mode "full": confirma o total; mode "partial": pede o valor recebido.
 * onSave({ amount, method }) — method "" = não informado.
 */
const ModalPaymentDash = ({
  mode = "partial",
  patientName,
  totalAmount,
  initialMethod = "",
  onClose,
  onSave,
}) => {
  const partial = mode === "partial";
  const total = Number(totalAmount) || 0;
  const [digits, setDigits] = useState("");
  const [method, setMethod] = useState(initialMethod || "");
  const [saving, setSaving] = useState(false);
  useEscapeKey(!saving, onClose);

  const amount = partial ? digitsToValue(digits) : total;

  const handleSave = async () => {
    if (partial && amount <= 0) {
      notify.error("Informe o valor recebido.");
      return;
    }
    if (partial && amount > total) {
      notify.error("O valor recebido é maior que o total do mês.");
      return;
    }
    setSaving(true);
    await onSave({ amount, method });
    setSaving(false);
  };

  return (
    <div
      onClick={closeOnBackdrop(saving ? () => {} : onClose)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-texto1/30 p-4 backdrop-blur-[4px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        className="w-full max-w-[420px] animate-toast-in rounded-2xl border border-cinza9 bg-bg1 shadow-dropShadow"
      >
        <div className="flex items-start gap-3 border-b border-cinza9 p-5 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-sucesso">
            <Icon
              d={
                partial
                  ? "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0v18"
                  : "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 9 3 3 5-6"
              }
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="payment-title"
              className="font-ubuntu text-lg font-bold tracking-tight text-texto1"
            >
              {partial ? "Pagamento parcial" : "Confirmar pagamento"}
            </h2>
            {patientName && (
              <p className="truncate text-sm text-texto3">{patientName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto3 transition hover:bg-clara4 hover:text-primaria"
          >
            <Icon d="M6 6l12 12M18 6 6 18" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className={`grid gap-2 ${partial ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="rounded-xl bg-clara4 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-texto3">
                Total do mês
              </p>
              <p className="mt-0.5 font-ubuntu text-lg font-bold text-texto1">
                {formatBRL(total)}
              </p>
            </div>
            {partial && (
              <label className="rounded-xl border border-cinza6 px-4 py-2.5 focus-within:border-primaria/60 focus-within:ring-4 focus-within:ring-clara3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-texto3">
                  Valor recebido
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  placeholder="R$ 0,00"
                  value={digits ? formatBRL(digitsToValue(digits)) : ""}
                  onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="block w-full bg-transparent font-ubuntu text-lg font-bold text-texto1 outline-none placeholder:text-texto3/60"
                />
              </label>
            )}
          </div>

          <fieldset>
            <legend className="mb-2 ml-1 text-sm font-semibold text-texto2">
              Forma de pagamento
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={method === option.id}
                  onClick={() => setMethod(method === option.id ? "" : option.id)}
                  className={`h-10 rounded-xl border text-sm font-semibold transition ${
                    method === option.id
                      ? "border-primaria bg-primaria text-white shadow-card"
                      : "border-cinza9 bg-bg1 text-texto2 hover:border-primaria/40 hover:text-primaria"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={method === ""}
                onClick={() => setMethod("")}
                className={`h-10 rounded-xl border text-xs font-semibold transition ${
                  method === ""
                    ? "border-texto3 bg-clara4 text-texto1"
                    : "border-cinza9 bg-bg1 text-texto3 hover:text-texto1"
                }`}
              >
                Não informar
              </button>
            </div>
            <p className="ml-1 mt-2 text-xs text-texto3">
              Aparece no recibo: “Pagamento recebido via …”.
            </p>
          </fieldset>
        </div>

        <div className="flex justify-end gap-2 border-t border-cinza9 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-full border border-cinza9 px-4 text-sm font-semibold text-texto2 transition hover:border-primaria/40 hover:text-primaria"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primaria px-5 text-sm font-semibold text-white shadow-card transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {partial ? "Salvar parcial" : `Confirmar ${formatBRL(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPaymentDash;
