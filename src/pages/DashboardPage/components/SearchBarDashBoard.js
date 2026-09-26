import React, { useState, useRef, useEffect } from "react";
import { ArrowLeftIcon, CloseIcon, SearchIcon } from "../../../icons/icons";
import { fetchCustomers } from "../../../service/pagesService/pagesService";

const SearchBarDashBoard = ({ patients, onConfirmPatient, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [remotePatients, setRemotePatients] = useState([]);
  const searchDropRef = useRef(null);

  useEffect(() => {
    const fetchRemotePatients = async () => {
      if (searchTerm) {
        const data = await fetchCustomers();
        setRemotePatients(data.customers || []);
      } else {
        setRemotePatients([]);
      }
    };

    fetchRemotePatients();
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPatients([]);
      setIsDropdownVisible(false);
    } else {
      // Filtro local
      const localFiltered = patients.filter((patient) =>
        patient?.Customer?.customer_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );

      // Filtro remoto, garantindo que não haja duplicados
      const remoteFiltered = remotePatients.filter(
        (remotePatient) =>
          !localFiltered.some(
            (local) => local.Customer?.customer_id === remotePatient.customer_id
          ) &&
          remotePatient?.customer_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );

      // Combinar os dois resultados
      const combinedResults = [...localFiltered, ...remoteFiltered];

      setFilteredPatients(combinedResults);
      setIsDropdownVisible(true);
    }
  }, [searchTerm, patients, remotePatients]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setRemotePatients([]);
    setFilteredPatients([]);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="relative z-30 w-full max-w-[360px]">
      <input
        type="text"
        placeholder={searchTerm ? "" : "Pesquisar paciente para vincular"}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`h-[44px] md:h-[56px] w-full rounded-lg md:rounded-xl ${
          searchTerm ? "md:rounded-b-none rounded-b-none" : ""
        } bg-clara3 pl-11 pr-10 text-texto2 text-sm md:text-base shadow-md focus:outline-none focus:ring-0 caret-primaria`}
      />
      <div className="absolute left-2 top-1/2 -translate-y-1/2 transform">
        {searchTerm.length > 0 ? (
          <div onClick={handleClearSearch} className="cursor-pointer">
            <ArrowLeftIcon />
          </div>
        ) : (
          <SearchIcon />
        )}
      </div>

      {searchTerm.length > 0 && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div onClick={handleClearSearch} className="cursor-pointer">
            <CloseIcon />
          </div>
        </div>
      )}

      {searchTerm.length > 0 &&
        filteredPatients.length === 0 &&
        isDropdownVisible && (
          <p className="absolute top-full left-0 w-full rounded-b-[15px] bg-clara3 px-4 py-2 text-center text-xs md:text-[12px] text-texto2 shadow-md">
            Paciente não encontrado
          </p>
        )}

      {searchTerm && filteredPatients.length > 0 && (
        <ul
          ref={searchDropRef}
          className="absolute top-full left-0 w-full bg-clara3 rounded-b-[15px] shadow-md max-h-[200px] overflow-y-auto z-10 border"
        >
          {filteredPatients.map((customer) => (
            <li
              key={customer.customer_id || customer.id}
              className="px-4 py-2 hover:bg-d_medio3 cursor-pointer border-b-[1px] border-cinza6 text-sm md:text-base"
              onClick={() => {
                onConfirmPatient(customer);
              }}
            >
              {customer?.Customer?.customer_name ||
                customer?.customer_name ||
                "Nome não disponível"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBarDashBoard;
