import React from "react";
import { ConfirmPaymentIcon, SendIcon, PartialIcon } from "./IconsDashBoard";

const DropDownDashActions = ({
  onOpenModal,
  onPartialPayment,
  onConfirmedPayment,
  onIssueInvoice,
}) => {
  return (
    <nav className="absolute right-0 w-[151px] h-[131px] md:w-[234px] md:h-[204px] md:mt-3 box-border border-[1px] border-solid border-cinza6 bg-bg2 shadow-default rounded-l-md">
      <ul className="w-[210px] h-auto mx-auto md:mt-8">
        <li>
          <button
            onClick={onOpenModal}
            className="group w-full flex text-center mt-1 gap-2  py-2 text-texto2 active:text-texto2/50 md:text-[15px] text-[9px] font-normal font-['Open Sans'] tracking-tight underline"
          >
            <SendIcon />
            Enviar Cobrança
          </button>
        </li>
        <li>
          <button
            onClick={onPartialPayment}
            className="group w-full flex text-center mt-1 gap-2 py-2 text-texto2 active:text-texto2/50 md:text-[15px] text-[9px] font-normal font-['Open Sans'] tracking-tight underline"
          >
            <PartialIcon />
            Pagamento Parcial
          </button>
        </li>

        <li>
          <button
            onClick={onConfirmedPayment}
            className="group w-full flex text-center mt-1 md:gap-1 gap-2 py-2 text-texto2 active:text-texto2/50 md:text-[15px] text-[9px] font-normal font-['Open Sans'] tracking-tight underline"
          >
            <ConfirmPaymentIcon />
            Pagamento Confirmado
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default DropDownDashActions;
