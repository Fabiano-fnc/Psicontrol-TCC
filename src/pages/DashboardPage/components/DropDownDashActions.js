import React from "react";
import { ConfirmPaymentIcon, SendIcon, PartialIcon } from "./IconsDashBoard";

const itemClass =
  "group flex w-full items-center gap-3 px-4 py-2 text-left text-sm md:text-[15px] text-texto2 font-normal font-openSans tracking-tight underline hover:bg-clara3 active:text-texto2/50";

const DropDownDashActions = ({
  onOpenModal,
  onPartialPayment,
  onConfirmedPayment,
}) => {
  return (
    <nav className="w-[220px] md:w-[234px] rounded-md border border-solid border-cinza6 bg-bg2 py-2 shadow-default">
      <ul>
        <li>
          <button onClick={onOpenModal} className={itemClass}>
            <SendIcon />
            Enviar Cobrança
          </button>
        </li>
        <li>
          <button onClick={onPartialPayment} className={itemClass}>
            <PartialIcon />
            Pagamento Parcial
          </button>
        </li>
        <li>
          <button onClick={onConfirmedPayment} className={itemClass}>
            <ConfirmPaymentIcon />
            Pagamento Confirmado
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default DropDownDashActions;
