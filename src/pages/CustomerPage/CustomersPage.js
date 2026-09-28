import { useEscapeKey } from "../../utils/Modal/useDismiss";
import ConfirmDialog from "../../utils/Modal/ConfirmDialog";
import ScheduleConsultations from "./components/ScheduleConsultations";
import React, { useEffect, useState, useRef } from "react";
import "../../index.css";
import CreateCustomerForm, {
  UsePatientDataButton,
} from "./components/CreateCustomerForm";
import {
  SearchIcon,
  ArrowLeftIcon,
  CloseIcon,
} from "../../icons/icons";
import {
  showArchiveToast,
  showDeleteToast,
} from "./components/notiificationCustomerPage";
import { useOutsideClick } from "../../utils/OutsideClick/useOutsideClick";
import { useModal } from "../../utils/Modal/useModal";
import ActionMenu from "../DashboardPage/components/ActionMenu";
import { showErrorToast } from "../../utils/notification/toastify";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArchiveCustomer,
  deleteCustomer,
  fetchCustomers,
} from "../../service/pagesService/pagesService";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isModalOpen, openModal, closeModal } = useModal();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  // Paciente para agendar consultas (justCreated: logo após o cadastro)
  const [scheduleFor, setScheduleFor] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isDropdownVisible] = useState(false);
  const [customer, setCustomer] = useState({
    customer_name: "",
    customer_cpf_cnpj: "",
  });

  const dropdownRef = useRef();
  const searchDropRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  useOutsideClick(searchDropRef, () => setFilteredCustomers([]));
  useOutsideClick(dropdownRef, () => setActiveDropdown(null));
  const closeDeleteModal = () => setIsConfirmModalOpen(false);
  useEscapeKey(isModalOpen, closeModal);
  useEscapeKey(isConfirmModalOpen, closeDeleteModal);

  const HandlefetchCustomers = async () => {
    setIsLoading(true);
    const data = await fetchCustomers().catch(() => {
      setError("Erro ao buscar clientes.");
      return null;
    });

    if (data && Array.isArray(data)) {
      setCustomers(data);
    } else if (data && data.customers) {
      setCustomers(data.customers);
    } else {
      setCustomers([]);
    }

    setIsLoading(false);
    setHasLoaded(true);
  };

  useEffect(() => {
    HandlefetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredCustomers([]);
    } else {
      setFilteredCustomers(
        Array.isArray(customers)
          ? customers.filter((customer) =>
              customer.customer_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
          : []
      );
    }
  }, [searchTerm, customers]);

  // Menu fixo na tela, como no dashboard: alinhado à direita do botão e
  // abrindo para cima quando não cabe embaixo
  const toggleDropdown = (customer_id, clickEvent) => {
    const rect = clickEvent.currentTarget.getBoundingClientRect();
    const MENU_W = 264;
    const MENU_H = 330;
    const left = Math.min(
      Math.max(rect.right - MENU_W, 8),
      window.innerWidth - MENU_W - 8
    );
    setMenuPosition(
      rect.bottom + MENU_H + 8 > window.innerHeight
        ? { left, bottom: window.innerHeight - rect.top + 4 }
        : { left, top: rect.bottom + 4 }
    );
    setActiveDropdown((prev) => (prev === customer_id ? null : customer_id));
  };

  useEscapeKey(activeDropdown !== null, () => setActiveDropdown(null));

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

  const handleUsePatientData = () => {
    setCustomer((prev) => ({
      ...prev,
      alternative_name: prev.customer_name,
      alternative_cpf_cnpj: prev.customer_cpf_cnpj,
    }));
  };

  const handleDeleteConfirmation = (customerId) => {
    setActiveDropdown(null);
    setCustomerToDelete(customerId);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    try {
      const response = await deleteCustomer(customerToDelete);

      if (response.ok) {
        HandlefetchCustomers();
        setIsConfirmModalOpen(false);
        setCustomerToDelete(null);
        showDeleteToast();
      } else {
        showErrorToast("Erro ao excluir cliente!");
      }
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleArchiveCustomer = async (customerId) => {
    setActiveDropdown(null);
    const response = await ArchiveCustomer(customerId);

    if (response.ok) {
      HandlefetchCustomers();
      showArchiveToast();
    } else {
      showErrorToast("Erro ao excluir cliente!");
    }
  };

  const handleAddPatient = (prefill = {}) => {
    setCustomer({
      customer_name: "",
      customer_cpf_cnpj: "",
      customer_phone: "",
      customer_email: "",
      consultation_fee: "",
      customer_dob: "",
      alternative_name: "",
      alternative_cpf_cnpj: "",
      ...prefill,
    });
    setIsEditing(false);
    openModal();
  };

  // Vindo do dashboard ("Cadastrar paciente"): abre o cadastro já preenchido.
  // copyFrom = paciente de outra agenda cujos dados são reaproveitados
  const newCustomerRequest = location.state?.newCustomer;
  useEffect(() => {
    if (!newCustomerRequest || !hasLoaded) return;
    const { copyFrom, ...prefill } = newCustomerRequest;
    const source = customers.find((c) => c.customer_id === copyFrom);
    handleAddPatient({
      ...(source && {
        customer_cpf_cnpj: source.customer_cpf_cnpj || "",
        customer_phone: source.customer_phone || "",
        customer_email: source.customer_email || "",
        consultation_fee: source.consultation_fee || "",
        alternative_name: source.alternative_name || "",
        alternative_cpf_cnpj: source.alternative_cpf_cnpj || "",
      }),
      ...prefill,
    });
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCustomerRequest, hasLoaded, customers]);

  const handleEditPatient = (patient) => {
    setActiveDropdown(null);
    setSelectedPatient(patient);
    setCustomer(patient);
    setIsEditing(true);
    openModal();
  };

  const handleNavigateClick = (customerId) => {
    navigate(`/customers/${customerId}/profile`);
  };

  return (
    <div className="w-full px-4 pb-8 pt-24 md:px-6 md:pt-28">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgM bg-opacity-30 p-4 backdrop-blur-[6px]">
          <div className="max-h-[92vh] w-full max-w-[1076px] overflow-y-auto rounded-2xl border border-cinza6 bg-bg1 p-5 shadow-lg md:p-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:px-6">
              <h2 className="text-[20px] md:text-[25px] font-medium font-ubuntu text-primaria">
                {isEditing ? "Editar Paciente" : "Adicionar Paciente"}
              </h2>
              <div className="hidden items-center justify-between gap-4 md:flex">
                <h3 className="text-[20px] md:text-[25px] font-medium font-ubuntu text-primaria">
                  Dados para recibo
                </h3>
                <UsePatientDataButton onClick={handleUsePatientData} />
              </div>
            </div>
            <CreateCustomerForm
              onClose={closeModal}
              onSubmit={HandlefetchCustomers}
              selectedPatient={selectedPatient}
              customer={customer}
              setCustomer={setCustomer}
              isEditing={isEditing}
              onCreated={(newCustomer) =>
                setScheduleFor({ customer: newCustomer, justCreated: true })
              }
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

      <div className="rounded-xl border border-solid border-cinza6 bg-bg1 shadow-card">
        <div className="flex flex-col gap-4 px-4 pt-6 md:flex-row md:items-center md:gap-8 md:px-7">
          <div className="relative w-full md:w-[360px]">
            <input
              type="text"
              placeholder={searchTerm ? "" : "Pesquisar pacientes"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-[48px] md:h-[56px] w-full rounded-xl ${searchTerm ? "rounded-b-none" : ""} bg-clara3 pl-11 pr-12 text-texto2 focus:outline-none focus:ring-0 caret-primaria`}
            />
            <div className="absolute left-1 top-1/2 -translate-y-1/2 transform">
              {searchTerm.length > 0 ? (
                <div
                  onClick={() => {
                    setSearchTerm("");
                    setFilteredCustomers([]);
                  }}
                  className="cursor-pointer"
                >
                  <ArrowLeftIcon />
                </div>
              ) : (
                <SearchIcon />
              )}
            </div>

            {searchTerm.length > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 transform">
                <div
                  onClick={() => {
                    setSearchTerm("");
                    setFilteredCustomers([]);
                  }}
                  className="cursor-pointer"
                >
                  <CloseIcon />
                </div>
              </div>
            )}
            {searchTerm &&
              filteredCustomers.length === 0 &&
              isDropdownVisible && (
                <p className="absolute top-full left-0 z-10 max-h-[200px] w-full overflow-y-auto rounded-b-[15px] border border-t-texto2 bg-clara3 px-4 py-2 text-center text-texto2 shadow-md">
                  Paciente não encontrado
                </p>
              )}

            {searchTerm && filteredCustomers.length > 0 && (
              <ul
                ref={searchDropRef}
                className="absolute top-full left-0 z-20 max-h-[200px] w-full overflow-auto rounded-b-[15px] border border-t-texto2 bg-clara3 shadow-md"
              >
                {filteredCustomers.map((customer) => (
                  <li
                    key={customer.customer_id}
                    className="cursor-pointer px-4 py-2 hover:bg-d_medio3"
                    onClick={() => {
                      setSearchTerm(customer.customer_name);
                      setFilteredCustomers([]);
                      handleNavigateClick(customer.customer_id);
                    }}
                  >
                    {customer.customer_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <button
              onClick={() => handleAddPatient()}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primaria px-3 sm:px-5 text-sm font-semibold text-white shadow-card transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="sm:hidden">Novo paciente</span>
              <span className="hidden sm:inline">Adicionar paciente</span>
            </button>

            <Link
              to="/archived"
              className="group inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-cinza9 bg-bg1 pl-1.5 pr-4 text-sm font-semibold text-texto2 transition hover:border-primaria/40 hover:text-primaria focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 active:scale-[0.98]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clara3 text-primaria transition group-hover:bg-primaria group-hover:text-white">
                <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M3.5 5h17v4h-17zM5 9v10h14V9M10 13h4" />
              </svg>
              </span>
              <span className="sm:hidden">Arquivados</span>
              <span className="hidden sm:inline">Pacientes arquivados</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-y border-cinza9 bg-clara4 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-texto3 md:px-8">
          <span>Paciente</span>
          <span>Ações</span>
        </div>

        <div className="w-full font-sans">
          {error && <p className="my-5 text-center text-red-500">{error}</p>}
          {isLoading ? (
            <p className="px-4 py-5 text-texto2 md:px-8">Carregando clientes...</p>
          ) : (
            <ul className="list-none">
              {customers
                .filter((customer) =>
                  customer.customer_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((customer) => (
                  <li
                    key={`customer-${customer.customer_id}`}
                    className="flex items-center justify-between gap-4 border-b border-cinza9 px-4 py-3 last:border-b-0 md:px-8 md:py-4"
                  >
                    <span
                      className="cursor-pointer break-words text-base text-texto1 hover:text-primaria hover:underline md:text-xl"
                      onClick={() => handleNavigateClick(customer.customer_id)}
                    >
                      {customer.customer_name}
                    </span>
                    <div
                      className="relative shrink-0"
                      ref={
                        activeDropdown === customer.customer_id
                          ? dropdownRef
                          : undefined
                      }
                    >
                      <button
                        onClick={(e) => toggleDropdown(customer.customer_id, e)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-texto3 transition hover:bg-clara3 hover:text-primaria focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 ${
                          activeDropdown === customer.customer_id
                            ? "bg-clara3 text-primaria"
                            : ""
                        }`}
                        aria-label="Ações do paciente"
                        aria-expanded={activeDropdown === customer.customer_id}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </button>
                      {activeDropdown === customer.customer_id && (
                        <div className="fixed z-40" style={menuPosition}>
                          <ActionMenu
                            title={customer.customer_name}
                            items={[
                              {
                                icon: "user",
                                label: "Conta do paciente",
                                hint: "Ver dados e recibo",
                                onClick: () =>
                                  handleNavigateClick(customer.customer_id),
                              },
                              {
                                icon: "edit",
                                label: "Editar paciente",
                                onClick: () => handleEditPatient(customer),
                              },
                              {
                                icon: "calendar",
                                label: "Agendar consultas",
                                hint: "Criar no Google Agenda",
                                onClick: () => {
                                  setActiveDropdown(null);
                                  setScheduleFor({ customer, justCreated: false });
                                },
                              },
                              {
                                icon: "archive",
                                label: "Arquivar paciente",
                                hint: "Sai da lista, sem apagar nada",
                                onClick: () =>
                                  handleArchiveCustomer(customer.customer_id),
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
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {scheduleFor && (
        <ScheduleConsultations
          customer={scheduleFor.customer}
          justCreated={scheduleFor.justCreated}
          onClose={() => setScheduleFor(null)}
          onScheduled={HandlefetchCustomers}
        />
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

export default CustomersPage;
