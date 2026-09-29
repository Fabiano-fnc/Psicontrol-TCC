import React from "react";
import ActionMenu from "./ActionMenu";

const DropDownDashActions = ({
  patientName,
  onOpenModal,
  onPartialPayment,
  onConfirmedPayment,
  onIssueReceipt,
  receiptNumber,
  hasPayment,
}) => (
  <ActionMenu
    title={patientName}
    items={[
      {
        icon: "send",
        label: "Enviar cobrança",
        hint: "Mensagem pelo WhatsApp",
        onClick: onOpenModal,
      },
      {
        icon: "partial",
        label: "Pagamento parcial",
        hint: "Registrar valor recebido",
        onClick: onPartialPayment,
      },
      {
        icon: "confirm",
        label: "Confirmar pagamento",
        hint: "Marcar o mês como pago",
        onClick: onConfirmedPayment,
      },
      {
        icon: "receipt",
        label: "Emitir recibo",
        hint: receiptNumber
          ? `Recibo nº ${String(receiptNumber).padStart(4, "0")} · baixar de novo`
          : hasPayment
          ? "PDF com o valor pago"
          : "Registre o pagamento antes",
        onClick: onIssueReceipt,
      },
    ]}
  />
);

export default DropDownDashActions;
