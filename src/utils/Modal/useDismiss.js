import { useEffect } from "react";

// Fecha o modal ao apertar Esc enquanto ele estiver aberto.
export const useEscapeKey = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
};

// Fecha o modal ao clicar no fundo escurecido (fora da caixa).
export const closeOnBackdrop = (onClose) => (event) => {
  if (event.target === event.currentTarget) onClose();
};
