import { closeOnBackdrop, useEscapeKey } from "../../../utils/Modal/useDismiss";
import React from "react";

const DeletePatientModal = ({ isOpen, onClose, onConfirm }) => {
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      onClick={closeOnBackdrop(onClose)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-destaque bg-opacity-30 p-4 backdrop-blur-[6px]">
      <div className="w-full max-w-[335px] rounded-lg border border-cinza6 bg-bg1 p-6 text-center shadow-default md:p-10">
        <p className="md:text-[21px] text-base mb-6 text-texto2 font-medium font-ubuntu leading-6 tracking-tight">
          Você tem certeza que deseja <br />
          <span className="text-primaria"> excluir </span>
          este paciente
        </p>
        <div className="flex justify-around">
          <button
            onClick={onClose}
            className="w-[74px] h-[36px] md:h-[40px] font-openSans text-sm border border-primaria md:rounded-[100px] rounded-[50px] shadow flex justify-center items-center text-primaria"
          >
            Não
          </button>
          <button
            onClick={onConfirm}
            className="w-[74px] h-[36px] md:h-[40px] font-openSans text-sm bg-primaria md:rounded-[100px] rounded-[50px] shadow flex justify-center items-center text-texto4"
          >
            Sim
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePatientModal;
