import React from "react";
import { useState } from "react";
import { CloseIconPaymentModal } from "./IconsDashBoard";

const ModalPaymentDash = ({ onClose, onSave, totalAmount }) => {
  const [paymentAmount, setPaymentAmount] = useState("");

  const formatCurrency = (value) => {
    if (typeof value !== "string") {
      value = value?.toString() || "0";
    }
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "R$ 00,00";
    return (parseFloat(numericValue) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const parseCurrency = (value) => {
    return Number(
      value
        .replace("R$", "")
        .trim()
        .replace(/\./g, "")
        .replace(",", ".")
    );
  };

  const handleInputChange = (e) => {
    setPaymentAmount(formatCurrency(e.target.value));
  };

  const handleSave = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Informe um valor válido.");
      return;
    }
    onSave(parseCurrency(paymentAmount));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgM bg-opacity-30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[445px] rounded-lg border border-cinza6 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="flex-1 text-center text-base md:text-F21 font-medium font-ubuntu tracking-tight text-primaria">
            Pagamento de Valor Parcial
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-clara3" aria-label="Fechar">
            <CloseIconPaymentModal />
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-texto1 text-center md:text-F15 text-sm font-normal font-openSans tracking-tight">
              Valor Total
            </label>
            <input
              type="text"
              className="mt-1 h-[42px] w-full rounded-B15 border-2 border-cinza6 px-3 py-2 text-center text-base md:text-lg text-texto2"
              value={`R$ ${totalAmount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`}
              disabled
            />
          </div>
          <div>
            <label className="block text-texto1 md:text-F15 text-sm text-center font-normal font-openSans tracking-tight">
              Valor Pago
            </label>
            <input
              type="text"
              placeholder="R$ 00,00"
              className="mt-1 h-[42px] w-full rounded-B15 border-2 border-cinza6 px-3 py-2 text-center text-base md:text-lg text-texto2"
              inputMode="numeric"
              value={paymentAmount}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primaria text-sm text-texto4 font-semibold font-openSans rounded-[100px] tracking-tight"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPaymentDash;
