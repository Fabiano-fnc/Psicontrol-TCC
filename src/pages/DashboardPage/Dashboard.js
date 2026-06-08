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
import {
  CrossIcon,
  VerifyGreenIcon,
  FilterIcon,
} from "./components/IconsDashBoard";
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

  const toggleDropdownPatients = (eventIndex, patient) => {
    if (patient && patient.customer_id) {
      setSelectedPatient(patient);
    } else {
      alert("Paciente não possui ID.");
    }

    setIsDropdownOpenPatients((prevIndex) =>
      prevIndex === eventIndex ? null : eventIndex
    );
  };

  const toggleDropdown = (eventIndex) => {
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
            ? { ...p, was_charged: true, payment_status: "pago" }
            : p
        )
      );
    } else {
      alert("Erro ao confirmar pagamento.");
    }
  };

  return (
    <div className="top-0 w-full p-6">
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          <div className="flex justify-center gap-1 mt-32 ">
            <div className="flex w-full justify-center gap-2">
              <Months
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                className="z-50"
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

            <div className="group md:mt-20 md:mb-2 mt-16 z-10">
              <FilterStatusDashBoard
                selectedStatus={selectedStatus}
                onChangeStatus={setSelectedStatus}
              />
              <FilterIcon />
            </div>
          </div>
          <div className="flex mt-3 md:mt-0 md:auto md:mx-auto justify-center box-border w-full md:rounded-B15 rounded-B10 md:border-[3px] border overflow-x-auto border-solid border-cinza6 bg-bg1 z-10">
            <div className="overflow-x-auto">
              <table className="table-fixed w-full bg-bg1 mt-5 text-left">
                <thead>
                  <tr>
                    <th className="text-center align-middle min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-2 md:px-4 py-1 md:py-2">
                      Paciente
                    </th>
                    <th className="text-center align-middle md:whitespace-nowrap min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-2 md:px-4 py-1 md:py-2">
                      Valor Consulta
                    </th>
                    <th className="text-center align-middle hidden md:table-cell min-w-[75px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-2 md:px-4 py-1 md:py-2">
                      Dia(s)
                    </th>
                    <th className="text-center align-middle md:whitespace-nowrap min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-2 md:px-4 py-1 md:py-2">
                      Nº de consultas
                    </th>
                    <th className=" text-center md:align-middle min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-5 md:px-4 py-1 md:py-2">
                      Total
                    </th>
                    <th className="text-center align-middle min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-3 md:px-4 py-1 md:py-2">
                      Cobrança
                    </th>
                    <th className="text-center align-middle min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-3 md:px-4 py-1 md:py-2">
                      Pagamento
                    </th>
                    <th className="text-center align-middle min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-5 md:px-4 py-1 md:py-2">
                      NF
                    </th>
                    <th className="text-center align-middle min-w-[100px] border-b border-b-cinza6 text-primaria md:text-lg text-F8 font-medium tracking-tight px-2 md:px-4 py-1 md:py-2">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient, index) => (
                      <tr key={index} className="relative">
                        <td className=" text-texto1 md:text-F15 text-F8 font-normal font-['Open Sans'] tracking-tight px-2 md:px-auto py-2 z-10">
                          <div className="flex flex-col justify-center leading-tight ">
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
                        <td className="text-center text-texto1 md:text-F15 text-F8 font-normal font-['Open Sans'] tracking-tight px-2 md:px-4 py-1 md:py-2">
                          R${" "}
                          {parseFloat(patient.consultation_fee)
                            .toFixed(2)
                            .replace(".", ",")}
                        </td>
                        <td className="hidden md:table-cell text-center text-texto1 md:text-F15 text-F8 font-normal font-['Open Sans'] tracking-tight px-2 md:px-4 py-1 md:py-2">
                          {patient.consultation_days
                            ? patient.consultation_days
                                .split(", ")
                                .map(Number)
                                .sort((a, b) => a - b)
                                .join(", ")
                            : "-"}
                        </td>
                        <td className="text-center text-texto1 md:text-F15 text-F8 font-normal font-['Open Sans'] tracking-tight px-2 md:px-4 py-1 md:py-2">
                          {patient.num_consultations || "-"}
                        </td>
                        <td className="text-center text-texto1 md:text-F15 text-F8 font-normal font-['Open Sans'] tracking-tight px-2 md:px-4 py-1 md:py-2">
                          R$ {patient.total_consultation_fee || "0,00"}
                        </td>
                        <td>
                          <div className="flex items-center justify-center text-center h-full">
                            {patient.sending_invoice ? (
                              <VerifyGreenIcon />
                            ) : (
                              <CrossIcon />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-center text-center h-full">
                            {" "}
                            {patient.payment_status === "pago" ? (
                              <VerifyGreenIcon />
                            ) : patient.payment_status === "parcial" ? (
                              <span className="text-texto2 md:text-F15 text-F8 font-semibold font-['Open Sans'] tracking-tight rounded-B15 border-2 border-aviso">
                                R${" "}
                                {parseFloat(patient.payment_amount || 0)
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </span>
                            ) : (
                              <CrossIcon />
                            )}{" "}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-center text-center h-full">
                            {patient.invoice_issued ? (
                              <VerifyGreenIcon />
                            ) : (
                              <CrossIcon />
                            )}
                          </div>
                        </td>

                        <td className="text-center px-2 md:px-4 py-1 md:py-2">
                          <button
                            className="cursor-pointer"
                            onClick={() =>
                              toggleDropdownPatients(index, patient)
                            }
                          >
                            <HamburguerIcon />
                          </button>
                          {isDropdownOpenPatients === index && (
                            <div className="absolute right-0 shadow-lg rounded p-2 z-20">
                              <DropDownDashActions
                                onOpenModal={() =>
                                  handleSendWhatsApp(patient, true)
                                }
                                onPartialPayment={() =>
                                  handleOpenPartialPayment(patient)
                                }
                                onConfirmedPayment={() =>
                                  handleConfirmPayment(patient)
                                }
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="md:text-base text-[8px] text-center px-2 md:px-4 py-1 md:py-2"
                      >
                        Nenhum registro encontrado para este mês e ano.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="relative mx-auto mt-[30px] box-border w-full  h-[122px] md:h-[263px] md:rounded-B15 rounded-B10 md:border-[3px] border overflow-y-auto border-solid border-cinza6 bg-bg1 ">
            {isSearchBarOpen && (
              <div className="absolute inset-0 bg-bg1 bg-opacity-30 backdrop-blur-sm h-auto z-10 "></div>
            )}
            <h2 className="mt-6 text-primaria md:text-F25 text-sm font-normal font-ubuntu px-4">
              Pacientes não encontrados
            </h2>
            <table className="min-w-full bg-bg1 mt-2">
              <tbody>
                {unmatchedPatients.length > 0 ? (
                  unmatchedPatients.map((event, index) => (
                    <tr
                      key={event.id}
                      className="border-b border-b-cinza6 relative"
                    >
                      <td className="px-4 py-2 flex items-center justify-between  md:text-F15 text-F8">
                        <span>{event.name}</span>
                        <button
                          className="cursor-pointer"
                          onClick={() => toggleDropdown(index)}
                        >
                          <HamburguerIcon />
                        </button>
                        {isDropdownOpen && selectedEvent === index && (
                          <div className="absolute right-0 shadow-lg rounded p-2 z-20">
                            <DropDownDashBoard
                              onVincular={() => handleVinculatePatient(event)}
                              onExcluir={() =>
                                openDeleteModal(event.google_event_id)
                              }
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center px-4 py-2">
                      Nenhum paciente não encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <DeletePatientModal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={confirmDelete}
            />
          </div>

          {isSearchBarOpen && (
            <SearchBarDashBoard
              patients={patients}
              onConfirmPatient={confirmLinkPatient}
              onClose={() => setIsSearchBarOpen(false)}
            />
          )}
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

      <>
        {isPartialPaymentModalOpen && selectedPatientForPartialPayment && (
          <ModalPaymentDash
            onClose={() => setIsPartialPaymentModalOpen(false)}
            onSave={handleSavePartialPayment}
            totalAmount={
              selectedPatientForPartialPayment.total_consultation_fee
            }
          />
        )}
      </>

      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center bg-destaque bg-opacity-30 backdrop-blur-[6px] z-30">
          <div className="bg-bg1 p-6 rounded-lg md:w-[335px] w-auto md:h-[228px] border border-cinza6 text-center md:mt-64 md:ml-64  mt-[10vh]">
            <p className="md:text-[21px] text-[12px] mb-4 text-texto2 font-medium font-ubuntu leading-6 tracking-tight">
              Você tem certeza que <br />
              deseja <span className="text-primaria">vincular</span> este <br />
              paciente à informação <br />
              <span>
                “
                {selectedPatient?.Customer?.customer_name ||
                  selectedPatient?.customer_name ||
                  "Nome não disponível"}
                ”
              </span>
              ?
            </p>
            <div className="flex justify-around mt-4">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                }}
                className="w-[50px] md:w-[74px] md:h-[40px] md:text-sm border border-primaria md:rounded-[100px] rounded-[50px] shadow flex justify-center items-center text-primaria"
              >
                Não
              </button>
              <button
                onClick={() => handleLinkPatient(selectedPatient?.customer_id)}
                className="w-[50px] md:w-[74px] md:h-[40px] md:text-sm bg-primaria md:rounded-[100px] rounded-[50px] shadow flex justify-center items-center text-texto4"
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
