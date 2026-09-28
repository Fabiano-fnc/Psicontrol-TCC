import { useEscapeKey } from "../../utils/Modal/useDismiss";
import ConfirmDialog from "../../utils/Modal/ConfirmDialog";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  SearchIcon,
  CloseIcon,
  HamburguerIcon,
} from "../../icons/icons";
import { useOutsideClick } from "../../utils/OutsideClick/useOutsideClick";
import DropDown from "../ArchivedPage/components/DropDownArchive";
import { deleteCustomer } from "../../service/pagesService/pagesService";
import { showErrorToast } from "../../utils/notification/toastify";
import { showDeleteToast } from "../CustomerPage/components/notiificationCustomerPage";

const ArchivedPage = () => {
  const [archivedCustomers, setArchivedCustomers] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDropdownVisible] = useState(false);

  const dropdownRef = useRef();
  const searchDropRef = useRef();

  useOutsideClick(dropdownRef, () => setActiveDropdown(null));
  useOutsideClick(searchDropRef, () => setFilteredCustomers([]));
  const closeDeleteModal = () => setIsConfirmModalOpen(false);
  useEscapeKey(isConfirmModalOpen, closeDeleteModal);

  const fetchArchivedCustomers = async () => {
    setIsLoading(true);
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/customers/archived`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setArchivedCustomers(data);
    } else {
      setError("Erro ao buscar pacientes arquivados.");
    }
    setIsLoading(false);
  };

  const handleUnarchiveCustomer = async (customerId) => {
    setActiveDropdown(null);
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/customers/${customerId}/archive`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived: false }),
      }
    );

    if (response.ok) {
      fetchArchivedCustomers();
    } else {
      setError("Erro ao desarquivar paciente!");
    }
  };

  useEffect(() => {
    fetchArchivedCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredCustomers([]);
    } else {
      setFilteredCustomers(
        archivedCustomers.filter((customer) =>
          customer.customer_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, archivedCustomers]);

  const handleDeleteConfirmation = (customerId) => {
    setActiveDropdown(null);
    setCustomerToDelete(customerId);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    try {
      const response = await deleteCustomer(customerToDelete);

      if (response.ok) {
        fetchArchivedCustomers();
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

  const toggleDropdown = (customer_id) => {
    setActiveDropdown((prev) => (prev === customer_id ? null : customer_id));
  };

  const visibleCustomers = archivedCustomers.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-4 pb-8 pt-24 md:px-6 md:pt-28">
      <Link
        to="/customers"
        className="mb-3 inline-flex w-fit items-center gap-1 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-texto3 transition hover:bg-clara3 hover:text-primaria focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 md:mb-4"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Pacientes
      </Link>

      <div className="rounded-xl border border-solid border-cinza6 bg-bg1 shadow-card">
        <div className="px-4 pt-6 md:px-7">
          <div className="relative w-full md:w-[360px]">
            <input
              type="text"
              placeholder={searchTerm ? "" : "Pesquisar"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-[48px] md:h-[56px] w-full rounded-xl ${searchTerm ? "rounded-b-none" : ""} bg-clara3 pl-11 pr-12 text-texto2 focus:outline-none focus:ring-0 caret-primaria`}
            />
            <div className="absolute left-1 top-1/2 -translate-y-1/2 transform">
              {searchTerm.length > 0 ? (
                <div
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="cursor-pointer"
                >
                  <ArrowLeftIcon />
                </div>
              ) : (
                <SearchIcon />
              )}
            </div>

            {searchTerm &&
              filteredCustomers.length === 0 &&
              isDropdownVisible && (
                <p className="absolute top-full left-0 z-10 max-h-[200px] w-full overflow-y-auto rounded-b-[15px] border border-t-texto2 bg-clara3 px-4 py-2 text-center text-texto2 shadow-md">
                  Paciente não encontrado
                </p>
              )}

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
            {searchTerm && filteredCustomers.length > 0 && (
              <ul
                ref={searchDropRef}
                className="absolute top-full left-0 z-20 max-h-[200px] w-full overflow-y-auto rounded-b-[15px] border border-t-texto2 bg-clara3 shadow-md"
              >
                {filteredCustomers.map((customer) => (
                  <li
                    key={customer.customer_id}
                    className="cursor-pointer px-4 py-2 hover:bg-d_medio3"
                    onClick={() => {
                      setSearchTerm(customer.customer_name);
                      setFilteredCustomers([]);
                    }}
                  >
                    {customer.customer_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-y border-cinza9 bg-clara4 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-texto3 md:px-8">
          <span>Pacientes Arquivados</span>
          <span>Ações</span>
        </div>

        <div className="w-full font-sans">
          {error && <p className="my-5 text-center text-red-500">{error}</p>}
          {isLoading ? (
            <p className="px-4 py-5 text-texto2 md:px-8">Carregando clientes...</p>
          ) : visibleCustomers.length === 0 ? (
            <p className="px-4 py-6 text-center text-texto2 md:px-8">
              {searchTerm
                ? "Nenhum paciente arquivado com esse nome."
                : "Nenhum paciente arquivado."}
            </p>
          ) : (
            <ul className="list-none">
              {visibleCustomers.map((customer) => (
                <li
                  key={`customer-${customer.customer_id}`}
                  className="flex items-center justify-between gap-4 border-b border-cinza9 px-4 py-3 last:border-b-0 md:px-8 md:py-4"
                >
                  <span className="break-words text-base text-texto1 md:text-xl">
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
                      aria-label="Ações do paciente arquivado"
                    >
                      <HamburguerIcon />
                    </button>
                    {activeDropdown === customer.customer_id && (
                      <DropDown
                        customerId={customer.customer_id}
                        onDelete={handleDeleteConfirmation}
                        onUnarchive={handleUnarchiveCustomer}
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

export default ArchivedPage;
