import { closeOnBackdrop, useEscapeKey } from "../../../utils/Modal/useDismiss";
import React from "react";
import { CloseIconMessageModal } from "./IconsDashBoard";

const buttonClass =
  "inline-flex h-[40px] w-full items-center justify-center rounded-full border border-primaria bg-bg1 px-3 text-center text-sm font-semibold font-['Open Sans'] tracking-tight text-primaria underline hover:bg-clara3";

const BillingDashBoard = ({ onClose, onSendEmail, onSendWhatsApp, message }) => {
  useEscapeKey(true, onClose);

  return (
    <div
      onClick={closeOnBackdrop(onClose)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bgM/30 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-[477px] flex-col rounded-B15 border border-cinza6 bg-bg1 p-6 shadow-default md:border-[3px]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="flex-1 text-center text-base md:text-[21px] font-medium font-ubuntu tracking-tight text-primaria">
            Enviar mensagem de cobrança
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-clara3"
            aria-label="Fechar"
          >
            <CloseIconMessageModal />
          </button>
        </div>
        <p
          className="mb-6 overflow-y-auto break-words text-sm text-texto1 font-openSans tracking-tight"
          dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, "<br />") }}
        ></p>
        <div className="mb-6 border-b border-cinza6"></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button onClick={onSendEmail} className={buttonClass}>
            Enviar por Email
          </button>
          <button onClick={onSendWhatsApp} className={buttonClass}>
            Enviar pelo WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingDashBoard;
