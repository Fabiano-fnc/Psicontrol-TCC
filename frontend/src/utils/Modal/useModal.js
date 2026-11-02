import { useState } from "react";

export const useModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return {
    isModalOpen,
    openModal,
    closeModal,
  };
};

export const useSuccessModal = () => {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const openSuccessModal = () => setIsSuccessModalOpen(true);
  const closeSuccessModal = () => setIsSuccessModalOpen(false);

  return {
    isSuccessModalOpen,
    openSuccessModal,
    closeSuccessModal,
  };
};