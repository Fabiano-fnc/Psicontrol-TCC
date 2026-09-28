import { useEscapeKey } from "../../utils/Modal/useDismiss";
import ConfirmDialog from "../../utils/Modal/ConfirmDialog";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ActionMenu from "../DashboardPage/components/ActionMenu";
import ScheduleConsultations from "../CustomerPage/components/ScheduleConsultations";
import CreateCustomerForm, {
  UsePatientDataButton,
} from "../CustomerPage/components/CreateCustomerForm";
import {
  ArchiveCustomer,
  deleteCustomer,
  fetchCustomerProfile,
} from "../../service/pagesService/pagesService";
import { showErrorToast } from "../../utils/notification/toastify";
import { useOutsideClick } from "../../utils/OutsideClick/useOutsideClick";
import {
  formatBRL,
  formatDocument,
  formatPhone,
} from "../../utils/format/format";
import {
  showDeleteProfileToast,
  showArchiveProfileToast,
} from "../ProfileCustomerPage/components/notificationProfilePage";

const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const icons = {
  back: "M15 18l-6-6 6-6",
  edit: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4",
};

// Mesmo bloco de informação usado em Minhas Configurações
const Info = ({ label, value, className = "" }) => (
  <div className={`min-w-0 rounded-xl bg-clara4 px-4 py-3 ${className}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-texto3">
      {label}
    </p>
    <p
      className={`mt-0.5 [overflow-wrap:anywhere] text-[15px] ${
        value ? "font-semibold text-texto1" : "italic text-texto3"
      }`}
    >
      {value || "Não informado"}
    </p>
  </div>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

const formatDate = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

const ProfileCustomerPage = () => {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [originalCustomer, setOriginalCustomer] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [calendarName, setCalendarName] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);

  const { customerId } = useParams();
  const navigate = useNavigate();

  const dropdownRef = useRef();
  useOutsideClick(dropdownRef, () => setActiveDropdown(null));
  useEscapeKey(activeDropdown !== null, () => setActiveDropdown(null));

  // O menu fica fixo na tela; se a página rolar ou mudar de tamanho, fecha
  useEffect(() => {
    if (activeDropdown === null) return;
    const close = () => setActiveDropdown(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [activeDropdown]);
  const closeDeleteModal = () => setIsConfirmModalOpen(false);
  useEscapeKey(isEditing, () => handleCancelEdit());
  useEscapeKey(isConfirmModalOpen, closeDeleteModal);

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

  // Nome da agenda do paciente (o perfil só traz o ID)
  useEffect(() => {
    if (!customer?.calendar_id) {
      setCalendarName("");
      return;
    }
    let active = true;
    const loadCalendarName = async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/events/calendars`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
        }
      ).catch(() => null);
      if (!response?.ok || !active) return;
      const calendars = await response.json();
      const match = calendars.find(
        (cal) => cal.calendar_id === customer.calendar_id
      );
      if (active) setCalendarName(match?.calendar_name || "");
    };
    loadCalendarName();
    return () => {
      active = false;
    };
  }, [customer?.calendar_id]);

  if (error || !customer) {
    return (
      <div className="w-full px-4 pb-8 pt-24 text-texto2 md:px-6 md:pt-28">
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
    setSelectedPatient(customer);
    setOriginalCustomer(customer); 
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setCustomer(originalCustomer); 
    setIsEditing(false);
  };

  const primaryButtonClass =
    "inline-flex h-9 items-center gap-2 rounded-full bg-primaria px-4 text-sm font-semibold text-white shadow-card transition hover:opacity-90 active:scale-[0.98]";
  const menuOpen = activeDropdown === customer.customer_id;

  return (
    <div className="w-full px-4 pb-8 pt-24 md:px-6 md:pt-28">
      <div className="mx-auto flex w-full max-w-[1076px] flex-col gap-3 md:gap-4">
        <Link
          to="/customers"
          className="inline-flex w-fit items-center gap-1 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-texto3 transition hover:bg-clara3 hover:text-primaria focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3"
        >
          <Icon d={icons.back} className="h-5 w-5" />
          Pacientes
        </Link>

        <div className="rounded-2xl border border-cinza9 bg-bg1 shadow-card">
          <div className="relative h-24 overflow-hidden rounded-t-2xl bg-gradient-to-br from-primaria to-primariaEscura md:h-28">
            <span className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-destaque/40 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="px-5 pb-5 md:px-6 md:pb-6">
            <div className="relative -mt-8 flex flex-wrap items-end justify-between gap-4 md:-mt-9">
              <div className="flex min-w-0 items-end gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-bg1 bg-gradient-to-br from-destaque to-primaria shadow-card md:h-24 md:w-24">
                  <span className="font-ubuntu text-3xl font-bold text-white md:text-4xl">
                    {customer.customer_name ? customer.customer_name.charAt(0) : ""}
                  </span>
                </div>
                <div className="min-w-0 pb-1">
                  <h2 className="break-words font-ubuntu text-xl font-bold tracking-tight text-texto1 md:text-2xl">
                    {customer.customer_name}
                  </h2>
                  <p className="text-sm text-texto3">
                    Paciente{customer.age ? ` · ${customer.age} anos` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={openModal} className={primaryButtonClass}>
                  <Icon d={icons.edit} className="h-4 w-4" />
                  Editar dados
                </button>
                <div
                  className="relative"
                  ref={menuOpen ? dropdownRef : undefined}
                >
                  <button
                    onClick={(e) => {
                      // Alinhado à direita do botão, sem sair da tela (264px = largura do menu)
                      const rect = e.currentTarget.getBoundingClientRect();
                      const left = Math.min(
                        Math.max(rect.right - 264, 8),
                        window.innerWidth - 264 - 8
                      );
                      setMenuPosition({ top: rect.bottom + 8, left });
                      toggleDropdown(customer.customer_id);
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-cinza9 text-texto3 transition hover:bg-clara3 hover:text-primaria focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 ${
                      menuOpen ? "bg-clara3 text-primaria" : "bg-bg1"
                    }`}
                    aria-label="Mais ações do paciente"
                    aria-expanded={menuOpen}
                  >
                    <MoreIcon />
                  </button>
                  {menuOpen && (
                    <div className="fixed z-30" style={menuPosition}>
                      <ActionMenu
                        title={customer.customer_name}
                        items={[
                          {
                            icon: "calendar",
                            label: "Agendar consultas",
                            hint: "Criar no Google Agenda",
                            onClick: () => {
                              setActiveDropdown(null);
                              setIsScheduleOpen(true);
                            },
                          },
                          {
                            icon: "archive",
                            label: "Arquivar paciente",
                            hint: "Sai da lista, sem apagar nada",
                            onClick: () =>
                              handleArchviveCustomer(customer.customer_id),
                          },
                          {
                            icon: "trash",
                            label: "Excluir paciente",
                            danger: true,
                            onClick: () =>
                              handleDeleteConfirmation(customer.customer_id),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="min-w-0">
                <h3 className="mb-3 text-sm font-semibold text-texto2">
                  Dados do paciente
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Info
                    label="CPF/CNPJ"
                    value={formatDocument(customer.customer_cpf_cnpj)}
                  />
                  <Info
                    label="Nascimento"
                    value={formatDate(customer.customer_dob)}
                  />
                  <Info
                    label="Telefone"
                    value={formatPhone(customer.customer_phone)}
                    className="col-span-2"
                  />
                  <Info
                    label="E-mail"
                    value={customer.customer_email}
                    className="col-span-2"
                  />
                </div>

                <h3 className="mb-3 mt-6 text-sm font-semibold text-texto2">
                  Atendimento
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Info
                    label="Valor da consulta"
                    value={
                      customer.consultation_fee
                        ? formatBRL(customer.consultation_fee)
                        : ""
                    }
                  />
                  <Info
                    label="Agenda"
                    value={customer.calendar_id ? calendarName || "…" : ""}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="mb-3 text-sm font-semibold text-texto2">
                  Dados para recibo
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Info
                    label="Nome"
                    value={customer.alternative_name}
                    className="col-span-2"
                  />
                  <Info
                    label="CPF/CNPJ"
                    value={formatDocument(customer.alternative_cpf_cnpj)}
                    className="col-span-2"
                  />
                  <Info
                    label="E-mail"
                    value={customer.customer_email}
                    className="col-span-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isScheduleOpen && (
        <ScheduleConsultations
          customer={customer}
          onClose={() => setIsScheduleOpen(false)}
        />
      )}

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgM bg-opacity-30 p-4 backdrop-blur-[6px]">
          <div className="max-h-[92vh] w-full max-w-[1076px] overflow-y-auto rounded-2xl border border-cinza6 bg-bg1 p-5 shadow-lg md:p-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:px-6">
              <h2 className="text-[20px] md:text-[25px] font-medium font-ubuntu text-primaria">
                Editar Paciente
              </h2>
              <div className="hidden items-center justify-between gap-4 md:flex">
                <h3 className="text-[20px] md:text-[25px] font-medium font-ubuntu text-primaria">
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
                  <h3 className="text-[20px] font-medium font-ubuntu text-primaria">
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
        <ConfirmDialog
          tone="danger"
          title="Excluir paciente?"
          confirmLabel="Excluir"
          onCancel={closeDeleteModal}
          onConfirm={handleDeleteCustomer}
        >
          O cadastro e o histórico de cobranças serão apagados, e as consultas
          voltam para “Pacientes não encontrados”. Esta ação não pode ser
          desfeita.
        </ConfirmDialog>
      )}
    </div>
  );
};

export default ProfileCustomerPage;
