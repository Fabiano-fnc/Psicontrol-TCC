import { notify } from "../../utils/notification/notify";
import { formatBRL } from "../../utils/format/format";
import { useEscapeKey } from "../../utils/Modal/useDismiss";
import React, { useState, useEffect } from "react";
import "../../index.css";
import ConfirmDialog from "../../utils/Modal/ConfirmDialog";
import DeletePatientModal from "./components/DeletePatientModal";
import DropDownDashBoard from "./components/DropDownDashBoard";
import LinkPatientModal from "./components/LinkPatientModal";
import {
  ShowVinculateToast,
  showDeleteToast,
  showConfirmPaymentToast,
} from "./components/ToastDashBoard";

import CardDashBoard from "./components/CardsDashBoard";
import DropDownDashActions from "./components/DropDownDashActions";
import BillingDashBoard from "./components/BillingDashBoard";
import ModalPaymentDash from "./components/ModalPaymentDash";
import FilterStatusDashBoard from "./components/FilterStatusDashBoard";
import InsightsDashBoard from "./components/InsightsDashBoard";
import { Months } from "../../utils/Months/months";
import { paymentMethodLabel } from "../../utils/format/paymentMethods";

const badgeStyles = {
  ok: "bg-green-50 text-green-700 ring-green-600/20",
  warn: "bg-amber-50 text-amber-700 ring-amber-600/20",
  pending: "bg-slate-100 text-texto3 ring-slate-500/20",
};

const StatusBadge = ({ tone, children }) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeStyles[tone]}`}
  >
    {children}
  </span>
);

// Três pontos verticais do botão de ações
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

const DashBoard = () => {
  const [patients, setPatients] = useState([]);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [netRevenue, setNetRevenue] = useState(0);
  const [netTime, setNetTime] = useState(0);
  const [overview, setOverview] = useState(null);
  const [overviewVersion, setOverviewVersion] = useState(0);
  // Horários das consultas do mês por paciente: { [customer_id]: { times, timed } }
  const [consultationTimes, setConsultationTimes] = useState({});
  // Recibos já emitidos no mês: { [customer_id]: número }
  const [receipts, setReceipts] = useState({});
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
  // Janela de pagamento: { mode: "full" | "partial", patient }
  const [paymentModal, setPaymentModal] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());


  const [menuPosition, setMenuPosition] = useState(null);
  const closeConfirmModal = () => setIsConfirmModalOpen(false);
  useEscapeKey(isConfirmModalOpen, closeConfirmModal);

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

  useEscapeKey(isDropdownOpenPatients !== null || isDropdownOpen, closeMenus);

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
      fetchBillingRecords(selectedMonth, selectedYear);
      setIsSearchBarOpen(false);
      setIsConfirmModalOpen(false);
      setSelectedPatient(null);
      ShowVinculateToast();
    } else {
      const data = await response.json().catch(() => ({}));
      notify.error(data.error || "Não foi possível vincular o paciente.");
      setIsConfirmModalOpen(false);
    }
  };

  const toggleDropdownPatients = (eventIndex, patient, clickEvent) => {
    setMenuPosition(getMenuPosition(clickEvent.currentTarget, 280));
    setIsDropdownOpen(false);
    if (patient && patient.customer_id) {
      setSelectedPatient(patient);
    } else {
      notify.error("Paciente não possui ID.");
    }

    setIsDropdownOpenPatients((prevIndex) =>
      prevIndex === eventIndex ? null : eventIndex
    );
  };

  const toggleDropdown = (eventIndex, clickEvent) => {
    setMenuPosition(getMenuPosition(clickEvent.currentTarget, 170));
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

  // Recebido x em aberto e histórico de 6 meses (não bloqueia a tela).
  // `overviewVersion` muda depois de registrar pagamentos, para recarregar.
  useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/dashboard/overview?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
        }
      );
      if (response.ok && active) {
        setOverview(await response.json());
      }
    };
    loadOverview();
    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear, overviewVersion]);

  useEffect(() => {
    let active = true;
    const loadTimes = async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/dashboard/consultation-times?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
        }
      ).catch(() => null);
      if (response?.ok && active) {
        setConsultationTimes(await response.json());
      }
    };
    loadTimes();
    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear, overviewVersion]);

  useEffect(() => {
    let active = true;
    const loadReceipts = async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/dashboard/receipts?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
        }
      ).catch(() => null);
      if (response?.ok && active) {
        setReceipts(await response.json());
      }
    };
    loadReceipts();
    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  // Gera (ou reemite, com o mesmo número) o PDF e baixa no aparelho
  const handleIssueReceipt = async (patient) => {
    if (!["pago", "parcial"].includes(patient.payment_status)) {
      notify.info("Registre o pagamento (total ou parcial) antes de emitir o recibo.");
      return;
    }
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/dashboard/receipts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          customer_id: patient.customer_id,
          month_and_year: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
        }),
      }
    ).catch(() => null);

    if (!response?.ok) {
      const data = await response?.json().catch(() => ({}));
      notify.error(data?.error || "Não foi possível emitir o recibo.");
      return;
    }

    const number = Number(response.headers.get("X-Receipt-Number"));
    const fileName =
      /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") || "")?.[1] ||
      "recibo.pdf";
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    if (number) {
      setReceipts((prev) => ({ ...prev, [patient.customer_id]: number }));
      notify.success(`Recibo nº ${String(number).padStart(4, "0")} emitido.`);
    }
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

  // Mês e ano juntos: uma única busca, sem usar o valor antigo do outro campo
  const handlePeriodChange = (month, year) => {
    const formattedMonth = String(month).padStart(2, "0");
    const formattedYear = String(year);
    setSelectedMonth(formattedMonth);
    setSelectedYear(formattedYear);
    fetchBillingRecords(formattedMonth, formattedYear);
  };

  useEffect(() => {
    setPatients([]);
    fetchBillingRecords(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);


  const closeBillingModal = () => {
    setIsBillingModalOpen(false);
  };

  // Grava que a cobrança do mês foi enviada e atualiza a tabela
  const markInvoiceSent = async (customerId) => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/dashboard/mark-invoice-sent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          month_and_year: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
        }),
      }
    );
    if (!response.ok) {
      notify.error("A mensagem foi aberta, mas não foi possível marcar a cobrança como enviada.");
      return;
    }
    setPatients((prevPatients) =>
      prevPatients.map((patient) =>
        patient.customer_id === customerId
          ? { ...patient, sending_invoice: true }
          : patient
      )
    );
    setIsBillingModalOpen(false);
  };

  const handleSendWhatsApp = async (customer, openModalOnly = false) => {
    const customerId = customer?.customer_id;

    if (!customerId) {
      notify.error("ID do cliente não encontrado.");
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
      setBillingMessage(data.user_message);

      // Só a prévia: nada é marcado como enviado até escolher WhatsApp ou e-mail
      if (openModalOnly) {
        setIsBillingModalOpen(true);
      } else {
        window.open(data.whatsappLink, "_blank");
        await markInvoiceSent(customerId);
      }
    } else {
      const errorData = await response.json();
      notify.error(errorData.error || "Não foi possível concluir a ação.");
    }
  };

  const handleSendEmail = async (customer) => {
    const customerId = customer?.customer_id;

    if (!customerId) {
      notify.error("ID do cliente não encontrado.");
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
      setBillingMessage(data.user_message);
      window.open(data.mailtoLink, "_blank");
      await markInvoiceSent(customerId);
    } else {
      const errorData = await response.json();
      notify.error(errorData.error || "Não foi possível concluir a ação.");
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
      notify.error(errorData.error || "Não foi possível concluir a ação.");
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

  // Confirma o mês inteiro ou registra um parcial, com a forma de pagamento
  const handleSavePayment = async ({ amount, method }) => {
    const { mode, patient } = paymentModal;
    const partial = mode === "partial";

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/dashboard/${
        partial ? "update-partial-payment" : "confirm-payment"
      }`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          customer_id: patient.customer_id,
          month_and_year: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
          payment_method: method || null,
          ...(partial ? { payment_amount: amount } : {}),
        }),
      }
    ).catch(() => null);

    if (!response?.ok) {
      notify.error(
        partial ? "Erro ao salvar pagamento parcial." : "Erro ao confirmar pagamento."
      );
      return;
    }

    showConfirmPaymentToast();
    setPatients((prevPatients) =>
      prevPatients.map((p) =>
        p.customer_id !== patient.customer_id
          ? p
          : partial
          ? {
              ...p,
              payment_amount: amount,
              payment_status: "parcial",
              payment_method: method || null,
            }
          : {
              ...p,
              was_charged: true,
              payment_status: "pago",
              invoice_issued: true,
              payment_method: method || null,
            }
      )
    );
    setPaymentModal(null);
    setOverviewVersion((v) => v + 1);
  };

  const actionButtonClass =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-texto3 transition hover:bg-clara3 hover:text-primaria focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3";
  const thClass =
    "whitespace-nowrap border-b border-b-cinza9 bg-clara4 px-3 md:px-4 py-3 text-center align-middle text-xs font-semibold uppercase tracking-wide text-texto3";
  const tdClass =
    "whitespace-nowrap px-3 md:px-4 py-2 text-center align-middle text-sm md:text-F15 text-texto1 font-normal font-openSans tracking-tight";

  return (
    <div className="w-full px-4 pb-8 pt-24 md:px-6 md:pt-28">
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          {/* Mês + indicadores */}
          <div className="grid grid-cols-2 gap-3 lg:flex lg:items-stretch lg:gap-4">
            <Months
              onMonthChange={handleMonthChange}
              onYearChange={handleYearChange}
              onPeriodChange={handlePeriodChange}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              wrapperClassName="col-span-2 z-20 lg:w-[216px] lg:shrink-0"
            />
            <CardDashBoard
              title="Nº de Consultas"
              value={totalConsultations}
              icon="consultas"
            />
            <CardDashBoard
              title="Receita Total"
              value={formatBRL(totalRevenue)}
              icon="receita"
            />
            <CardDashBoard
              title="Receita líquida"
              value={formatBRL(netRevenue)}
              icon="liquida"
              destaque
            />
            <CardDashBoard
              title="Hora líquida"
              value={formatBRL(netTime)}
              icon="hora"
            />
          </div>

          <InsightsDashBoard
            overview={overview}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />

          <div className="relative z-10 mt-6 mb-2 flex justify-end">
            <FilterStatusDashBoard
              selectedStatus={selectedStatus}
              onChangeStatus={setSelectedStatus}
            />
          </div>

          {/* Faturamento do mês */}
          <div className="relative z-0 w-full overflow-x-auto rounded-lg md:rounded-xl border border-solid border-cinza6 bg-bg1 shadow-card">
            <table className="w-full min-w-[940px] bg-bg1 text-left">
              <thead>
                <tr>
                  <th className={`${thClass} sticky left-0 z-10 text-left`}>
                    Paciente
                  </th>
                  <th className={thClass}>Valor Consulta</th>
                  <th className={thClass}>Dia(s)</th>
                  <th className={thClass}>Horário</th>
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
                      <td className="sticky left-0 z-10 bg-bg1 px-3 md:px-4 py-2 text-sm md:text-F15 text-texto1 font-openSans tracking-tight">
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
                        {formatBRL(patient.consultation_fee)}
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
                        {(() => {
                          const info = consultationTimes[patient.customer_id];
                          if (!info) {
                            return <span className="text-texto3">Dia inteiro</span>;
                          }
                          const allDay =
                            (patient.num_consultations || 0) - info.timed;
                          return (
                            <div className="flex flex-col items-center leading-tight">
                              <span>{info.times.join(", ")}</span>
                              {allDay > 0 && (
                                <span className="text-xs text-texto3">
                                  + {allDay} dia inteiro
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={tdClass}>
                        {patient.num_consultations || "-"}
                      </td>
                      <td className={tdClass}>
                        {formatBRL(patient.total_consultation_fee)}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-center">
                          {patient.sending_invoice ? (
                            <StatusBadge tone="ok">Enviada</StatusBadge>
                          ) : (
                            <StatusBadge tone="pending">Pendente</StatusBadge>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          {patient.payment_status === "pago" ? (
                            <StatusBadge tone="ok">
                              Pago
                              {patient.payment_method &&
                                ` · ${paymentMethodLabel(patient.payment_method)}`}
                            </StatusBadge>
                          ) : patient.payment_status === "parcial" ? (
                            <StatusBadge tone="warn">
                              Parcial · {formatBRL(patient.payment_amount)}
                            </StatusBadge>
                          ) : (
                            <StatusBadge tone="pending">Em aberto</StatusBadge>
                          )}
                          {receipts[patient.customer_id] && (
                            <span className="text-[11px] text-texto3">
                              Recibo nº{" "}
                              {String(receipts[patient.customer_id]).padStart(4, "0")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-center">
                          {patient.invoice_issued ? (
                            <StatusBadge tone="ok">Emitida</StatusBadge>
                          ) : (
                            <StatusBadge tone="pending">Pendente</StatusBadge>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <button
                          data-menu
                          className={`${actionButtonClass} mx-auto ${
                            isDropdownOpenPatients === index
                              ? "bg-clara3 text-primaria"
                              : ""
                          }`}
                          aria-label="Ações do paciente"
                          aria-expanded={isDropdownOpenPatients === index}
                          onClick={(e) =>
                            toggleDropdownPatients(index, patient, e)
                          }
                        >
                          <MoreIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
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
                  patientName={
                    filteredPatients[isDropdownOpenPatients].Customer
                      ?.customer_name
                  }
                  onOpenModal={() => {
                    closeMenus();
                    handleSendWhatsApp(
                      filteredPatients[isDropdownOpenPatients],
                      true
                    );
                  }}
                  onPartialPayment={() => {
                    closeMenus();
                    setPaymentModal({
                      mode: "partial",
                      patient: filteredPatients[isDropdownOpenPatients],
                    });
                  }}
                  onConfirmedPayment={() => {
                    closeMenus();
                    setPaymentModal({
                      mode: "full",
                      patient: filteredPatients[isDropdownOpenPatients],
                    });
                  }}
                  receiptNumber={
                    receipts[filteredPatients[isDropdownOpenPatients].customer_id]
                  }
                  hasPayment={["pago", "parcial"].includes(
                    filteredPatients[isDropdownOpenPatients].payment_status
                  )}
                  onIssueReceipt={() => {
                    closeMenus();
                    handleIssueReceipt(filteredPatients[isDropdownOpenPatients]);
                  }}
                />
              </div>
            )}

          {/* Pacientes não encontrados */}
          <div className="relative z-0 mt-8 rounded-lg md:rounded-xl border border-solid border-cinza6 bg-bg1 shadow-card">
            <h2 className="px-4 pt-5 font-ubuntu text-lg font-semibold text-texto1 md:px-6 md:text-xl">
              Pacientes não encontrados
            </h2>


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
                          <span className="min-w-0">
                            <span className="block break-words">
                              {event.name}
                            </span>
                            <span className="block text-xs text-texto3">
                              {[
                                event.date &&
                                  event.date.split("-").reverse().join("/"),
                                event.calendar_name,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                            {event.duplicate_of && (
                              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-texto2">
                                <span className="rounded-full bg-aviso/15 px-2 py-0.5 font-semibold text-texto1">
                                  Possível duplicado
                                </span>
                                <span>
                                  {event.duplicate_of.customer_name} já tem
                                  consulta neste dia em{" "}
                                  {event.duplicate_of.calendar_name}
                                </span>
                              </span>
                            )}
                          </span>
                          <button
                            data-menu
                            className={`${actionButtonClass} shrink-0 ${
                              isDropdownOpen && selectedEvent === index
                                ? "bg-clara3 text-primaria"
                                : ""
                            }`}
                            aria-label="Ações do evento"
                            aria-expanded={isDropdownOpen && selectedEvent === index}
                            onClick={(e) => toggleDropdown(index, e)}
                          >
                            <MoreIcon />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-texto3">
                        Todos os eventos da agenda estão vinculados a pacientes.
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
                eventName={unmatchedPatients[selectedEvent].name}
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

          {isSearchBarOpen && (
            <LinkPatientModal
              event={unmatchedPatients[selectedEvent]}
              paused={isConfirmModalOpen}
              onSelect={confirmLinkPatient}
              onClose={() => setIsSearchBarOpen(false)}
            />
          )}

          <DeletePatientModal
            isOpen={isDeleteModalOpen}
            eventName={
              unmatchedPatients.find(
                (event) => event.google_event_id === eventToDelete
              )?.name
            }
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
              notify.error("Paciente não encontrado ou sem ID.");
            }
          }}
          onSendEmail={() => {
            if (selectedPatient && selectedPatient.customer_id) {
              handleSendEmail(selectedPatient);
            } else {
              notify.error("Paciente não encontrado ou sem ID.");
            }
          }}
          message={billingMessage}
        />
      )}

      {paymentModal && (
        <ModalPaymentDash
          mode={paymentModal.mode}
          patientName={paymentModal.patient.Customer?.customer_name}
          totalAmount={paymentModal.patient.total_consultation_fee}
          initialMethod={paymentModal.patient.payment_method}
          onClose={() => setPaymentModal(null)}
          onSave={handleSavePayment}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmDialog
          icon="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
          title="Vincular paciente?"
          confirmLabel="Vincular"
          onCancel={closeConfirmModal}
          onConfirm={() => handleLinkPatient(selectedPatient?.customer_id)}
        >
          {unmatchedPatients[selectedEvent]?.name ? (
            <>
              O evento{" "}
              <strong className="text-texto1">
                “{unmatchedPatients[selectedEvent].name}”
              </strong>{" "}
              será vinculado a{" "}
            </>
          ) : (
            "Os eventos serão vinculados a "
          )}
          <strong className="text-texto1">
            {selectedPatient?.Customer?.customer_name ||
              selectedPatient?.customer_name ||
              "este paciente"}
          </strong>
          .
        </ConfirmDialog>
      )}
    </div>
  );
};

export default DashBoard;
