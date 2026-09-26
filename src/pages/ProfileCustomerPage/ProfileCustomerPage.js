import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DropDownProfile from "./components/DropdownProfilePage";
import CreateCustomerForm, {
  UsePatientDataButton,
} from "../CustomerPage/components/CreateCustomerForm";
import {
  ArchiveCustomer,
  deleteCustomer,
  fetchCustomerProfile,
} from "../../service/pagesService/pagesService";
import { HamburguerIcon } from "../../icons/icons";
import { showErrorToast } from "../../utils/notification/toastify";
import { useOutsideClick } from "../../utils/OutsideClick/useOutsideClick";
import {
  showDeleteProfileToast,
  showArchiveProfileToast,
} from "../ProfileCustomerPage/components/notificationProfilePage";

const ProfileCustomerPage = () => {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [originalCustomer, setOriginalCustomer] = useState(null);

  const { customerId } = useParams();
  const navigate = useNavigate();

  const dropdownRef = useRef();
  useOutsideClick(dropdownRef, () => setActiveDropdown(null));

  const toggleDropdown = (customer_id) => {
    setActiveDropdown((prev) => (prev === customer_id ? null : customer_id));
  };

  useEffect(() => {
    const handleFetchCustomerProfile = async (cutomerId) => {
      const response = await fetchCustomerProfile(customerId);
      if (!response.ok) {
        setError("Erro ao buscar o perfil do paciente");
        return;
      }
      const data = await response.json();
      setCustomer(data);
    };

    handleFetchCustomerProfile();
  }, [customerId]);

  if (error || !customer) {
    return (
      <div className="w-full px-4 pb-8 pt-32 text-texto2 md:px-6 md:pt-28">
        {error || "Carregando..."}
      </div>
    );
  }

  const handleDeleteConfirmation = (customerId) => {
    setActiveDropdown(null);
    setCustomerToDelete(customerId);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    try {
      const response = await deleteCustomer(customerToDelete);

      if (response.ok) {
        setIsConfirmModalOpen(false);
        setCustomerToDelete(null);
        showDeleteProfileToast();
        navigate("/customers");
      } else {
        showErrorToast("Erro ao excluir cliente!");
      }
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleArchviveCustomer = async (customerId) => {
    setActiveDropdown(null);
    const response = await ArchiveCustomer(customerId);
    if (response.ok) {
      showArchiveProfileToast();
      navigate("/customers");
    } else {
      showErrorToast("Erro ao arquivar paciente!");
    }
  };

  // O formulário já salva o paciente; aqui só recarregamos o perfil atualizado.
  const reloadProfile = async () => {
    const profileResponse = await fetchCustomerProfile(customerId);
    if (profileResponse.ok) {
      setCustomer(await profileResponse.json());
    }
    setIsEditing(false);
  };

  const handleUsePatientData = () => {
    setCustomer((prev) => ({
      ...prev,
      alternative_name: prev.customer_name,
      alternative_cpf_cnpj: prev.customer_cpf_cnpj,
    }));
  };
  const openModal = () => {
    setActiveDropdown(null);
    setOriginalCustomer(customer); 
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setCustomer(originalCustomer); 
    setIsEditing(false);
  };

  const lineClass =
    "mt-2 text-base md:text-F17 font-normal font-['Open Sans'] tracking-normal text-texto1";
  const valueClass = "break-words text-texto2";
  const orNotInformed = (value) => value || "Não informado";

  return (
    <div className="w-full px-4 pb-8 pt-32 md:px-6 md:pt-28">
      <div className="relative mx-auto w-full max-w-[1076px] rounded-[15px] border-2 border-cinza6 bg-bg1 p-5 text-F15 shadow md:p-6">
        <div
          className="absolute right-3 top-3"
          ref={activeDropdown === customer.customer_id ? dropdownRef : undefined}
        >
          <button
            onClick={() => toggleDropdown(customer.customer_id)}
            className="rounded-full p-2 hover:bg-clara3"
            aria-label="Ações do paciente"
          >
            <HamburguerIcon />
          </button>
          {activeDropdown === customer.customer_id && (
            <DropDownProfile
              customerId={customer.customer_id}
              onDelete={handleDeleteConfirmation}
              setSelectedPatient={setSelectedPatient}
              openModal={openModal}
              customer={customer}
              onArchive={handleArchviveCustomer}
            />
          )}
        </div>

        <h2 className="mb-6 pr-12 text-xl md:text-F25 font-medium font-['Ubuntu'] text-primaria md:ml-5">
          Conta do paciente
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
          <div className="min-w-0 md:ml-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaria text-white">
                {customer.customer_name ? customer.customer_name.charAt(0) : ""}
              </div>
              <h3 className="break-words text-lg md:text-F20 font-medium font-['Ubuntu'] tracking-normal">
                {customer.customer_name}
              </h3>
            </div>
            <div className="mt-2 md:ml-14">
              <p className={lineClass}>
                <strong>CPF/CNPJ:</strong>{" "}
                <span className={valueClass}>
                  {orNotInformed(customer.customer_cpf_cnpj)}
                </span>
              </p>
              <p className={lineClass}>
                <strong>Idade:</strong>{" "}
                <span className={valueClass}>
                  {customer.age ? `${customer.age} anos` : "Não informado"}
                </span>
              </p>
              <p className={lineClass}>
                <strong>E-mail:</strong>{" "}
                <span className={`${valueClass} [overflow-wrap:anywhere]`}>
                  {orNotInformed(customer.customer_email)}
                </span>
              </p>
              <p className={lineClass}>
                <strong>Telefone:</strong>{" "}
                <span className={valueClass}>
                  {orNotInformed(customer.customer_phone)}
                </span>
              </p>
            </div>
          </div>

          <div className="min-w-0 border-t border-cinza9 pt-6 md:border-t-0 md:pt-2">
            <h3 className="text-lg md:text-F20 font-bold">Dados para recibo</h3>
            <p className={`${lineClass} mt-4`}>
              <strong>Nome:</strong>{" "}
              <span className={valueClass}>
                {orNotInformed(customer.alternative_name)}
              </span>
            </p>
            <p className={lineClass}>
              <strong>CPF/CNPJ:</strong>{" "}
              <span className={valueClass}>
                {orNotInformed(customer.alternative_cpf_cnpj)}
              </span>
            </p>
            <p className={lineClass}>
              <strong>E-mail:</strong>{" "}
              <span className={`${valueClass} [overflow-wrap:anywhere]`}>
                {orNotInformed(customer.customer_email)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgM bg-opacity-30 p-4 backdrop-blur-[6px]">
          <div className="max-h-[92vh] w-full max-w-[1076px] overflow-y-auto rounded-[25px] border-2 border-cinza6 bg-bg1 p-5 shadow-lg md:p-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:px-6">
              <h2 className="text-[20px] md:text-[25px] font-medium font-['Ubuntu'] text-primaria">
                Editar Paciente
              </h2>
              <div className="hidden items-center justify-between gap-4 md:flex">
                <h3 className="text-[20px] md:text-[25px] font-medium font-['Ubuntu'] text-primaria">
                  Dados para recibo
                </h3>
                <UsePatientDataButton onClick={handleUsePatientData} />
              </div>
            </div>

            <CreateCustomerForm
              onClose={handleCancelEdit}
              onSubmit={reloadProfile}
              selectedPatient={selectedPatient}
              customer={customer}
              setCustomer={setCustomer}
              isEditing
              receiptHeader={
                <div className="flex flex-wrap items-center justify-between gap-3 md:hidden">
                  <h3 className="text-[20px] font-medium font-['Ubuntu'] text-primaria">
                    Dados para recibo
                  </h3>
                  <UsePatientDataButton onClick={handleUsePatientData} />
                </div>
              }
            />
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-destaque bg-opacity-30 p-4 backdrop-blur-[6px]">
          <div className="w-full max-w-[335px] rounded-lg border border-cinza6 bg-bg1 p-6 text-center shadow-default">
            <p className="mb-6 text-lg font-semibold text-texto2">
              Você tem certeza que deseja
              <span className="text-primaria"> excluir </span>
              este paciente de forma permanente?
            </p>
            <div className="flex justify-around">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="inline-flex h-[40px] w-[74px] items-center justify-center rounded-full border border-primaria text-primaria shadow"
              >
                Não
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="inline-flex h-[40px] w-[74px] items-center justify-center rounded-full bg-primaria text-texto4 shadow"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCustomerPage;
