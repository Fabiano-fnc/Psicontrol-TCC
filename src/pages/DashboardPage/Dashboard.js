import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "../../index.css";
import DeletePatientModal from "./components/DeletePatientModal";
import { fetchCustomers } from "../../service/pagesService/pagesService";
import DropDownDashBoard from "./components/DropDownDashBoard";
import SearchBarDashBoard from "./components/SearchBarDashBoard";
import { HamburguerIcon } from "../../icons/icons";
import {
  ShowVinculateToast,
  showDeleteToast,
  showConfirmPaymentToast,
} from "./components/ToastDashBoard";
import { CrossIcon, VerifyGreenIcon } from "./components/IconsDashBoard";
import CardDashBoard from "./components/CardsDashBoard";
import DropDownDashActions from "./components/DropDownDashActions";
import BillingDashBoard from "./components/BillingDashBoard";
import ModalPaymentDash from "./components/ModalPaymentDash";
import FilterStatusDashBoard from "./components/FilterStatusDashBoard";
import { Months } from "../../utils/Months/months";

const DashBoard = () => {
  const [customersData, setCustomersData] = useState([]);
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [patients, setPatients] = useState([]);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [netRevenue, setNetRevenue] = useState(0);
  const [netTime, setNetTime] = useState(0);
  const [billingMessage, setBillingMessage] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isDropdownOpenPatients, setIsDropdownOpenPatients] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [unmatchedPatients, setUnmatchedPatients] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchBarOpen, setIsSearchBarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] =
    useState(false);
  const [
    selectedPatientForPartialPayment,
    setSelectedPatientForPartialPayment,
  ] = useState(null);
  const calendarIdsParam = searchParams.get("calendarIds");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const selectedCalendarIds = useMemo(
    () => (calendarIdsParam ? calendarIdsParam.split(",") : []),
    [calendarIdsParam]
  );

  const dropdownRef = useRef();
  const [menuPosition, setMenuPosition] = useState(null);

  // Os menus de ação ficam em posição fixa na tela para não serem cortados
  // pelas áreas com rolagem (tabela e lista de pacientes não encontrados).
  const getMenuPosition = (target, menuHeight) => {
    const rect = target.getBoundingClientRect();
    const right = Math.max(window.innerWidth - rect.right, 8);
    const opensUp = rect.bottom + menuHeight + 8 > window.innerHeight;
    return opensUp
      ? { right, bottom: window.innerHeight - rect.top + 4 }
      : { right, top: rect.bottom + 4 };
  };

  const closeMenus = () => {
    setIsDropdownOpenPatients(null);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    if (isDropdownOpenPatients === null && !isDropdownOpen) return;

    const handlePointerDown = (event) => {
      if (!event.target.closest("[data-menu]")) closeMenus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", closeMenus, true);
    window.addEventListener("resize", closeMenus);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", closeMenus, true);
      window.removeEventListener("resize", closeMenus);
    };
  }, [isDropdownOpenPatients, isDropdownOpen]);

  useEffect(() => {
    const fetchCalendars = async () => {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/events/calendars`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const filteredCalendars = data.filter((calendar) =>
          selectedCalendarIds.includes(calendar.id)
        );
        setCalendars(filteredCalendars);
        if (filteredCalendars.length > 0 && !selectedCalendarId) {
          setSelectedCalendarId(filteredCalendars[0].id);
        }
      } else {
        setError("Erro ao buscar calendários");
      }
      setLoading(false);
    };
    fetchCalendars();
  }, [selectedCalendarIds, selectedCalendarId]);

  const fetchEvents = async () => {
    if (selectedCalendarId === "") return;

    setLoading(true);
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/get-events/${selectedCalendarId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
      }
    );
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedEvents = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setEvents(sortedEvents);
      }
    } else {
      setError("Erro ao buscar eventos");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCalendarId]);

  const fetchUnmatchedPatients = async () => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/unmatched-patients`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setUnmatchedPatients(data);
    } else {
      return null;
    }
  };

  useEffect(() => {
    fetchUnmatchedPatients();
  }, []);

  const fetchPatientData = async () => {
    setLoading(true);
    const data = await fetchCustomers();
    setCustomersData(
      (data.customers || []).filter((customer) => customer.customer_name)
    );
    setTotalConsultations(data.totalConsultations || 0);
    setTotalRevenue(parseFloat(data.totalRevenue || 0));
    setLoading(false);
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const handleLinkPatient = async (customer_id) => {
    if (selectedEvent === null || selectedEvent === undefined) {
      return null;
    }

    const event = unmatchedPatients[selectedEvent];

    if (!customer_id) {
      return null;
    }
    if (!event) {
      return null;
    }

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/linkCustomerToEvent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          eventId: event.customers_id,
          customer_id: customer_id,
        }),
      }
    );

    if (response.ok) {
      fetchUnmatchedPatients();
      fetchUnmatchedPatients();
      setIsSearchBarOpen(false);
      setIsConfirmModalOpen(false);
      setSelectedPatient(null);
      ShowVinculateToast();
    } else {
      setIsConfirmModalOpen(false);
    }
  };

  const toggleDropdownPatients = (eventIndex, patient, clickEvent) => {
    setMenuPosition(getMenuPosition(clickEvent.currentTarget, 210));
    setIsDropdownOpen(false);
    if (patient && patient.customer_id) {
      setSelectedPatient(patient);
    } else {
      alert("Paciente não possui ID.");
    }

    setIsDropdownOpenPatients((prevIndex) =>
      prevIndex === eventIndex ? null : eventIndex
    );
  };

  const toggleDropdown = (eventIndex, clickEvent) => {
    setMenuPosition(getMenuPosition(clickEvent.currentTarget, 130));
    setIsDropdownOpenPatients(null);
    const event = unmatchedPatients[eventIndex];
    if (!event) {
      return;
    }
    if (isDropdownOpen && selectedEvent === eventIndex) {
      setIsDropdownOpen(false);
      setSelectedEvent(null);
    } else {
      setSelectedEvent(eventIndex);
      setIsDropdownOpen(true);
    }
  };

  const handleVinculatePatient = async () => {
    if (selectedEvent === null || selectedEvent === undefined) {
      return null;
    }
    const event = unmatchedPatients[selectedEvent];
    if (!event) {
      return null;
    }
    if (!patients || patients.length === 0) {
      await fetchPatientData();
    }
    openSearchBar();
  };

  const confirmLinkPatient = (patient) => {
    setSelectedPatient(patient);
    setIsConfirmModalOpen(true);
  };

  const openSearchBar = () => {
    if (selectedEvent === null || selectedEvent === undefined) {
      return null;
    }
    setIsSearchBarOpen(true);
    setIsDropdownOpen(false);
  };

  const fetchBillingRecords = async (month, year) => {
    setLoading(true);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/dashboard/billing-records?month=${month}&year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "authentication_token"
          )}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setPatients(data.billingRecords || []);
      setTotalConsultations(data.totalConsultations || 0);
      setTotalRevenue(parseFloat(data.totalRevenue || 0));
      setNetRevenue(parseFloat(data.netRevenue || 0));
      setNetTime(parseFloat(data.netTime) || 0);
      setFilteredPatients(data.billingRecords || []);
    } else if (response.status === 404) {
      setPatients([]);
      setFilteredPatients([]);
      setTotalConsultations(0);
      setTotalRevenue(0);
    } else {
      setError("Erro ao buscar registros de faturamento.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const filterPatients = () => {
      const filtered = patients.filter((patient) => {
        if (selectedStatus.length === 0) return true;
        const matchesPaymentStatus =
          (selectedStatus.includes("aberto") && !patient.payment_status) ||
          selectedStatus.includes(patient.payment_status);

        const matchesInvoiceStatus =
          (selectedStatus.includes("realizada") && patient.sending_invoice) ||
          (selectedStatus.includes("nao-realizada") &&
            !patient.sending_invoice);

        return matchesPaymentStatus || matchesInvoiceStatus;
      });

      setFilteredPatients(filtered);
    };

    filterPatients();
  }, [selectedStatus, patients]);

  useEffect(() => {
    const currentDate = new Date();
    const initialMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const initialYear = String(currentDate.getFullYear());

    setSelectedMonth(initialMonth);
    setSelectedYear(initialYear);

    fetchBillingRecords(initialMonth, initialYear);
  }, []);

  const handleMonthChange = (month) => {
    const formattedMonth = String(month).padStart(2, "0");
    setSelectedMonth(formattedMonth);
    fetchBillingRecords(formattedMonth, selectedYear);
  };

  const handleYearChange = (year) => {
    const formattedYear = String(year);
    setSelectedYear(formattedYear);
    fetchBillingRecords(selectedMonth, formattedYear);
  };

  useEffect(() => {
    setPatients([]);
    fetchBillingRecords(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const openBillingModal = () => {
    setIsBillingModalOpen(true);
  };

  const closeBillingModal = () => {
    setIsBillingModalOpen(false);
  };

  const handleSendWhatsApp = async (customer, openModalOnly = false) => {
    const customerId = customer?.customer_id;

    if (!customerId) {
      alert("ID do cliente não encontrado.");
      return;
    }

    setLoading(true);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/message/send-whatsapp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          selected_month: `${selectedYear}-${selectedMonth}`,
        }),
      }
    );

    setLoading(false);
    if (response.ok) {
      const data = await response.json();

      await fetch(
        `${process.env.REACT_APP_API_URL}/dashboard/mark-invoice-sent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "authentication_token"
            )}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
            month_and_year: `${selectedYear}-${selectedMonth}`,
          }),
        }
      );

      const whatsappLink = data.whatsappLink;
      setBillingMessage(data.user_message);

      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient.customer_id === customerId
            ? { ...patient, sending_invoice: true }
            : patient
        )
      );

      if (openModalOnly) {
        setIsBillingModalOpen(true);
      } else {
        alert("Redirecionando para o WhatsApp...");
        window.open(whatsappLink, "_blank");
      }
    } else {
      const errorData = await response.json();
      alert(`Erro: ${errorData.error}`);
    }
  };

  const handleSendEmail = async (customer) => {
    const customerId = customer?.customer_id;

    if (!customerId) {
      alert("ID do cliente não encontrado.");
      return;
    }

    setLoading(true);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/message/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          total_consultation_fee: customer.total_consultation_fee,
          selected_month: `${selectedYear}-${selectedMonth}`,
        }),
      }
    );

    setLoading(false);

    if (response.ok) {
      const data = await response.json();
      const mailtoLink = data.mailtoLink;
      setBillingMessage(data.user_message);
      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient.customer_id === customerId
            ? { ...patient, sending_invoice: true }
            : patient
        )
      );
      alert("Abrindo cliente de email...");
      window.open(mailtoLink, "_blank");
    } else {
      const errorData = await response.json();
      alert(`Erro: ${errorData.error}`);
    }
  };

  const handleDeleteUnmatchedEvent = async (google_event_id) => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/unmatched-patients/${google_event_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
      }
    );

    if (response.ok) {
      showDeleteToast();
      fetchUnmatchedPatients();
    } else {
      const errorData = await response.json();
      alert(`Erro: ${errorData.error}`);
    }
  };

  const openDeleteModal = (google_event_id) => {
    setEventToDelete(google_event_id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      handleDeleteUnmatchedEvent(eventToDelete); // Chama a função de deletar
      setIsDeleteModalOpen(false); // Fecha o modal
    }
  };

  const handleSavePartialPayment = async (paymentAmount) => {
    if (!selectedPatientForPartialPayment) return;

    const { customer_id } = selectedPatientForPartialPayment;

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/dashboard/update-partial-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          customer_id,
          month_and_year: `${selectedYear}-${selectedMonth}`,
          payment_amount: parseFloat(paymentAmount),
        }),
      }
    );

    if (response.ok) {
      showConfirmPaymentToast();
      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient.customer_id === customer_id
            ? {
                ...patient,
                payment_amount: parseFloat(paymentAmount),
                payment_status: "parcial",
              }
            : patient
        )
      );

      setIsPartialPaymentModalOpen(false);
    } else {
      alert("Erro ao salvar pagamento parcial.");
    }
  };

  const handleOpenPartialPayment = (patient) => {
    setSelectedPatientForPartialPayment(patient);
    setIsPartialPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (patient) => {
    if (!patient || !patient.customer_id) {
      alert("Paciente não encontrado.");
      return;
    }

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/dashboard/confirm-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          customer_id: patient.customer_id,
          month_and_year: `${selectedYear}-${selectedMonth}`,
        }),
      }
    );

    if (response.ok) {
      showConfirmPaymentToast();
      setPatients((prevPatients) =>
        prevPatients.map((p) =>
          p.customer_id === patient.customer_id
            ? {
                ...p,
                was_charged: true,
                payment_status: "pago",
                invoice_issued: true,
              }
            : p
        )
      );
    } else {
      alert("Erro ao confirmar pagamento.");
    }
  };

  const thClass =
    "whitespace-nowrap border-b border-b-cinza6 px-3 md:px-4 py-2 text-center align-middle text-sm md:text-lg font-medium tracking-tight text-primaria";
  const tdClass =
    "whitespace-nowrap px-3 md:px-4 py-2 text-center align-middle text-sm md:text-F15 text-texto1 font-normal font-['Open Sans'] tracking-tight";

  return (
    <div className="w-full px-4 pb-8 pt-32 md:px-6 md:pt-28">
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          {/* Mês + indicadores */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 pt-2 lg:flex lg:items-center lg:gap-3 lg:pt-4">
            <Months
              onMonthChange={handleMonthChange}
              onYearChange={handleYearChange}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              wrapperClassName="col-span-2 z-20 lg:flex-1"
            />
            <CardDashBoard
              title="Nº de Consultas"
              value={totalConsultations}
              isCurrency={false}
            />
            <CardDashBoard
              title="Receita Total"
              value={totalRevenue.toFixed(2).replace(".", ",")}
              isCurrency={true}
            />
            <CardDashBoard
              title="Receita líquida"
              value={netRevenue.toFixed(2).replace(".", ",")}
              isCurrency={true}
            />
            <CardDashBoard
              title="Hora líquida"
              value={netTime.toFixed(2).replace(".", ",")}
              isCurrency={true}
            />
          </div>

          <div className="relative z-10 mt-6 mb-2 flex justify-end">
            <FilterStatusDashBoard
              selectedStatus={selectedStatus}
              onChangeStatus={setSelectedStatus}
            />
          </div>

          {/* Faturamento do mês */}
          <div className="relative z-0 w-full overflow-x-auto rounded-B10 md:rounded-B15 border md:border-[3px] border-solid border-cinza6 bg-bg1">
            <table className="w-full min-w-[860px] bg-bg1 text-left">
              <thead>
                <tr>
                  <th className={`${thClass} sticky left-0 z-10 bg-bg1 text-left`}>
                    Paciente
                  </th>
                  <th className={thClass}>Valor Consulta</th>
                  <th className={thClass}>Dia(s)</th>
                  <th className={thClass}>Nº de consultas</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Cobrança</th>
                  <th className={thClass}>Pagamento</th>
                  <th className={thClass}>NF</th>
                  <th className={thClass}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient, index) => (
                    <tr
                      key={index}
                      className="border-b border-b-cinza9 last:border-b-0 hover:bg-clara4"
                    >
                      <td className="sticky left-0 z-10 bg-bg1 px-3 md:px-4 py-2 text-sm md:text-F15 text-texto1 font-['Open Sans'] tracking-tight">
                        <div className="flex flex-col justify-center leading-tight">
                          <span>
                            {patient.Customer?.customer_name?.split(" ")[0] ||
                              "-"}
                          </span>
                          <span>
                            {patient.Customer?.customer_name
                              ?.split(" ")
                              .slice(1)
                              .join(" ") || ""}
                          </span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        R${" "}
                        {parseFloat(patient.consultation_fee)
                          .toFixed(2)
                          .replace(".", ",")}
                      </td>
                      <td className={`${tdClass} whitespace-normal min-w-[120px]`}>
                        {patient.consultation_days
                          ? patient.consultation_days
                              .split(", ")
                              .map(Number)
                              .sort((a, b) => a - b)
                              .join(", ")
                          : "-"}
                      </td>
                      <td className={tdClass}>
                        {patient.num_consultations || "-"}
                      </td>
                      <td className={tdClass}>
                        R$ {patient.total_consultation_fee || "0,00"}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-center">
                          {patient.sending_invoice ? (
                            <VerifyGreenIcon />
                          ) : (
                            <CrossIcon />
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-center">
                          {patient.payment_status === "pago" ? (
                            <VerifyGreenIcon />
                          ) : patient.payment_status === "parcial" ? (
                            <span className="rounded-B15 border-2 border-aviso px-2 text-sm md:text-F15 font-semibold text-texto2">
                              R${" "}
                              {parseFloat(patient.payment_amount || 0)
                                .toFixed(2)
                                .replace(".", ",")}
                            </span>
                          ) : (
                            <CrossIcon />
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-center">
                          {patient.invoice_issued ? (
                            <VerifyGreenIcon />
                          ) : (
                            <CrossIcon />
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <button
                          data-menu
                          className="cursor-pointer rounded-full p-2 hover:bg-clara3"
                          aria-label="Ações do paciente"
                          onClick={(e) =>
                            toggleDropdownPatients(index, patient, e)
                          }
                        >
                          <HamburguerIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-6 text-center text-sm md:text-base text-texto2"
                    >
                      Nenhum registro encontrado para este mês e ano.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isDropdownOpenPatients !== null &&
            filteredPatients[isDropdownOpenPatients] && (
              <div data-menu className="fixed z-40" style={menuPosition}>
                <DropDownDashActions
                  onOpenModal={() => {
                    closeMenus();
                    handleSendWhatsApp(
                      filteredPatients[isDropdownOpenPatients],
                      true
                    );
                  }}
                  onPartialPayment={() => {
                    closeMenus();
                    handleOpenPartialPayment(
                      filteredPatients[isDropdownOpenPatients]
                    );
                  }}
                  onConfirmedPayment={() => {
                    closeMenus();
                    handleConfirmPayment(
                      filteredPatients[isDropdownOpenPatients]
                    );
                  }}
                />
              </div>
            )}

          {/* Pacientes não encontrados */}
          <div className="relative z-0 mt-8 rounded-B10 md:rounded-B15 border md:border-[3px] border-solid border-cinza6 bg-bg1">
            <h2 className="px-4 pt-5 text-lg md:text-F25 font-normal font-ubuntu text-primaria">
              Pacientes não encontrados
            </h2>

            {isSearchBarOpen && (
              <div
                className="absolute inset-0 z-20 rounded-B10 md:rounded-B15 bg-bg1/30 p-4 backdrop-blur-sm"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setIsSearchBarOpen(false);
                }}
              >
                <SearchBarDashBoard
                  patients={patients}
                  onConfirmPatient={confirmLinkPatient}
                  onClose={() => setIsSearchBarOpen(false)}
                />
              </div>
            )}

            <div className="mt-2 max-h-[263px] min-h-[140px] overflow-y-auto">
              <table className="min-w-full bg-bg1">
                <tbody>
                  {unmatchedPatients.length > 0 ? (
                    unmatchedPatients.map((event, index) => (
                      <tr
                        key={event.google_event_id || index}
                        className="border-b border-b-cinza6 last:border-b-0"
                      >
                        <td className="flex items-center justify-between gap-3 px-4 py-2 text-sm md:text-F15 text-texto1">
                          <span className="break-words">{event.name}</span>
                          <button
                            data-menu
                            className="shrink-0 cursor-pointer rounded-full p-2 hover:bg-clara3"
                            aria-label="Ações do evento"
                            onClick={(e) => toggleDropdown(index, e)}
                          >
                            <HamburguerIcon />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-4 text-center text-sm md:text-base text-texto2">
                        Nenhum paciente não encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {isDropdownOpen && unmatchedPatients[selectedEvent] && (
            <div data-menu className="fixed z-40" style={menuPosition}>
              <DropDownDashBoard
                onVincular={() =>
                  handleVinculatePatient(unmatchedPatients[selectedEvent])
                }
                onExcluir={() => {
                  setIsDropdownOpen(false);
                  openDeleteModal(
                    unmatchedPatients[selectedEvent].google_event_id
                  );
                }}
              />
            </div>
          )}

          <DeletePatientModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
          />
        </>
      )}

      {isBillingModalOpen && selectedPatient && (
        <BillingDashBoard
          onClose={closeBillingModal}
          onSendWhatsApp={() => {
            if (selectedPatient && selectedPatient.customer_id) {
              handleSendWhatsApp(selectedPatient);
            } else {
              alert("Paciente não encontrado ou sem ID.");
            }
          }}
          onSendEmail={() => {
            if (selectedPatient && selectedPatient.customer_id) {
              handleSendEmail(selectedPatient);
            } else {
              alert("Paciente não encontrado ou sem ID.");
            }
          }}
          message={billingMessage}
        />
      )}

      {isPartialPaymentModalOpen && selectedPatientForPartialPayment && (
        <ModalPaymentDash
          onClose={() => setIsPartialPaymentModalOpen(false)}
          onSave={handleSavePartialPayment}
          totalAmount={selectedPatientForPartialPayment.total_consultation_fee}
        />
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-destaque bg-opacity-30 p-4 backdrop-blur-[6px]">
          <div className="w-full max-w-[335px] rounded-lg border border-cinza6 bg-bg1 p-6 text-center shadow-default">
            <p className="mb-4 text-base md:text-[21px] text-texto2 font-medium font-ubuntu leading-6 tracking-tight">
              Você tem certeza que deseja{" "}
              <span className="text-primaria">vincular</span> este paciente à
              informação{" "}
              <span>
                “
                {selectedPatient?.Customer?.customer_name ||
                  selectedPatient?.customer_name ||
                  "Nome não disponível"}
                ”
              </span>
              ?
            </p>
            <div className="mt-4 flex justify-around">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                }}
                className="flex h-[36px] w-[74px] items-center justify-center rounded-full border border-primaria text-sm text-primaria shadow md:h-[40px]"
              >
                Não
              </button>
              <button
                onClick={() => handleLinkPatient(selectedPatient?.customer_id)}
                className="flex h-[36px] w-[74px] items-center justify-center rounded-full bg-primaria text-sm text-texto4 shadow md:h-[40px]"
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

export default DashBoard;
