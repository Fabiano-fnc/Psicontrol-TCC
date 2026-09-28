import React from "react";
import ConfirmDialog from "../../../utils/Modal/ConfirmDialog";

// Exclui um evento de "Pacientes não encontrados" (o backend também apaga do Google Agenda)
const DeletePatientModal = ({ isOpen, eventName, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <ConfirmDialog
      tone="danger"
      title="Excluir evento?"
      confirmLabel="Excluir"
      onCancel={onClose}
      onConfirm={onConfirm}
    >
      {eventName ? (
        <>
          O evento <strong className="text-texto1">“{eventName}”</strong> será
          apagado também do Google Agenda.
        </>
      ) : (
        "O evento será apagado também do Google Agenda."
      )}
    </ConfirmDialog>
  );
};

export default DeletePatientModal;
