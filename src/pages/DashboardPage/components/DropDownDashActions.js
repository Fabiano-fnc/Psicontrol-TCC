import React from "react";
import ActionMenu from "./ActionMenu";

const DropDownDashActions = ({
  patientName,
  onOpenModal,
  onPartialPayment,
  onConfirmedPayment,
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
    ]}
  />
);

export default DropDownDashActions;
