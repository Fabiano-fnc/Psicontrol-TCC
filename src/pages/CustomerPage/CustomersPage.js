import React, { useEffect, useState, useRef } from "react";
import "../../index.css";
import CreateCustomerForm, {
  UsePatientDataButton,
} from "./components/CreateCustomerForm";
import {
  SearchIcon,
  AddIcon,
  ArchiveIcon,
  HamburguerIcon,
  ArrowLeftIcon,
  CloseIcon,
} from "../../icons/icons";
import {
  showArchiveToast,
  showDeleteToast,
} from "./components/notiificationCustomerPage";
import { useOutsideClick } from "../../utils/OutsideClick/useOutsideClick";
import { useModal } from "../../utils/Modal/useModal";
import DropDonw from "./components/dropdownCustomerPage";
import { showErrorToast } from "../../utils/notification/toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  ArchiveCustomer,
  deleteCustomer,
  fetchCustomers,
} from "../../service/pagesService/pagesService";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isModalOpen, openModal, closeModal } = useModal();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDropdownVisible] = useState(false);
  const [customer, setCustomer] = useState({
    customer_name: "",
    customer_cpf_cnpj: "",
  });

  const dropdownRef = useRef();
  const searchDropRef = useRef();
  const inputRef = useRef();
  const navigate = useNavigate();

  useOutsideClick(searchDropRef, () => setFilteredCustomers([]));
  useOutsideClick(dropdownRef, () => setActiveDropdown(null));

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

  const toggleDropdown = (customer_id) => {
    setActiveDropdown((prev) => (prev === customer_id ? null : customer_id));
  };

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

  const handleAddPatient = () => {
    setCustomer({
      customer_name: "",
      customer_cpf_cnpj: "",
      customer_phone: "",
      customer_email: "",
      consultation_fee: "",
      customer_dob: "",
      alternative_name: "",
      alternative_cpf_cnpj: "",
    });
    setIsEditing(false);
    openModal();
  };

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
    <div className="w-full px-4 pb-8 pt-32 md:px-6 md:pt-28">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgM bg-opacity-30 p-4 backdrop-blur-[6px]">
          <div className="max-h-[92vh] w-full max-w-[1076px] overflow-y-auto rounded-[25px] border-2 border-cinza6 bg-bg1 p-5 shadow-lg md:p-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:px-6">
              <h2 className="text-[20px] md:text-[25px] font-medium font-['Ubuntu'] text-primaria">
                {isEditing ? "Editar Paciente" : "Adicionar Paciente"}
              </h2>
              <div className="hidden items-center justify-between gap-4 md:flex">
                <h3 className="text-[20px] md:text-[25px] font-medium font-['Ubuntu'] text-primaria">
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

      <div className="rounded-[15px] border-[3px] border-solid border-cinza6 bg-bg1">
        <div className="flex flex-col gap-4 px-4 pt-6 md:flex-row md:items-center md:gap-8 md:px-7">
          <div className="relative w-full md:w-[360px]">
            <input
              type="text"
              placeholder={searchTerm ? "" : "Pesquisar pacientes"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-[48px] md:h-[56px] w-full rounded-[15px] ${searchTerm ? "rounded-b-none" : ""} bg-clara3 pl-11 pr-12 text-texto2 focus:outline-none focus:ring-0 caret-primaria`}
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

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <button
              onClick={handleAddPatient}
              className="flex h-[41px] w-[200px] items-center justify-center space-x-2 rounded-[10px] border-2 border-solid border-primaria bg-bg1 px-4 text-center font-['Ubuntu'] text-sm font-semibold leading-[20px] tracking-[0.15px] text-primaria shadow-md hover:bg-clara4 active:shadow-innerShadow"
            >
              <AddIcon />
              <span>Adicionar paciente</span>
            </button>

            <Link
              to="/archived"
              className="group flex items-center gap-2 whitespace-nowrap text-sm font-medium leading-4 tracking-wider text-primaria underline active:text-primaria/50"
            >
              <ArchiveIcon />
              Pacientes arquivados
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-b border-cinza6 px-4 pb-3 font-['Ubuntu'] text-lg font-medium leading-[21px] tracking-[0.09px] text-primaria md:px-8">
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
                    className="flex items-center justify-between gap-4 border-b border-cinza6 px-4 py-3 last:border-b-0 md:px-8 md:py-4"
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
                        onClick={() => toggleDropdown(customer.customer_id)}
                        className="flex items-center rounded-full p-2 hover:bg-clara3"
                        aria-label="Ações do paciente"
                      >
                        <HamburguerIcon />
                      </button>
                      {activeDropdown === customer.customer_id && (
                        <DropDonw
                          customerId={customer.customer_id}
                          onDelete={handleDeleteConfirmation}
                          setSelectedPatient={setSelectedPatient}
                          openModal={() => handleEditPatient(customer)}
                          customers={customers}
                          onArchive={handleArchiveCustomer}
                        />
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

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

export default CustomersPage;
