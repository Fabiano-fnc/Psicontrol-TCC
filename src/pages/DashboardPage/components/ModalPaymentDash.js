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
    <div className="fixed inset-0 flex items-start justify-center bg-bgM bg-opacity-30 backdrop-blur-sm md:z-30 z-50 ">
      <div className="bg-white rounded-lg shadow-lg p-6 md:w-[445px] w-[280px] md:h-[280px] h-44 border border-cinza6 md:mt-40 md:ml-64 mt-[18vh]">
        <div className="flex justify-between items-center md:mb-4">
          <h2 className="flex justify-center text-center md:text-F21 text-sm text-primaria font-medium font-ubuntu md:ml-[78px] ml-8 md:mt-5  tracking-tight ">
            Pagamento de Valor Parcial
          </h2>
          <button onClick={onClose}>
            <CloseIconPaymentModal />
          </button>
        </div>

        <div className="flex md:ml-8  md:mb-12 mb-4 ml-2">
          <div className="mr-4">
            <label className="block text-texto1 text-center md:text-F15 text-xs font-normal font-openSans tracking-tight">
              Valor Total
            </label>
            <input
              type="text"
              className="md:w-[159.85px] w-[100.58px] md:h-[42.21px] h-[26.54px]  md:text-lg text-xs text-center text-texto2 border-2 border-cinza6 rounded-B15 px-3 py-2 mt-1"
              value={`R$ ${totalAmount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`}
              disabled
            />
          </div>
          <div>
            <label className="block text-texto1 md:text-F15 text-xs text-center font-normal font-openSans tracking-tight">
              Valor Pago
            </label>
            <input
              type="text"
              placeholder="R$ 00,00"
              className="md:w-[159.85px] w-[100.58px] md:h-[42.21px] h-[26.54px]  md:text-lg text-xs text-center text-texto2 border-2 border-cinza6 rounded-B15 px-3 py-2 mt-1"
              value={paymentAmount}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="flex justify-center md:ml-36 mr-0 items-center">
          <button
            onClick={handleSave}
            className="px-4 py-2 md:mr-36 bg-primaria md:text-sm text-F10 text-texto4 font-semibold font-openSans rounded-[100px] tracking-tight"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPaymentDash;
