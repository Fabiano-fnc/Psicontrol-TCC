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
    <div className="w-full px-4 pb-8 pt-32 md:px-6 md:pt-28">
      <Link
        to="/customers"
        className="mb-4 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primaria underline hover:bg-clara3"
      >
        ← Voltar para pacientes
      </Link>

      <div className="rounded-[15px] border-[3px] border-solid border-cinza6 bg-bg1">
        <div className="px-4 pt-6 md:px-7">
          <div className="relative w-full md:w-[360px]">
            <input
              type="text"
              placeholder={searchTerm ? "" : "Pesquisar"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-[48px] md:h-[56px] w-full rounded-[15px] ${searchTerm ? "rounded-b-none" : ""} bg-clara3 pl-11 pr-12 text-texto2 focus:outline-none focus:ring-0 caret-primaria`}
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

        <div className="mt-6 flex items-center justify-between border-b border-cinza6 px-4 pb-3 font-['Ubuntu'] text-lg font-medium leading-[21px] tracking-[0.09px] text-primaria md:px-8">
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
                  className="flex items-center justify-between gap-4 border-b border-cinza6 px-4 py-3 last:border-b-0 md:px-8 md:py-4"
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

export default ArchivedPage;
