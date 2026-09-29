import { notify } from "../../utils/notification/notify";
import { closeOnBackdrop, useEscapeKey } from "../../utils/Modal/useDismiss";
import React, { useState, useEffect, useRef } from "react";
import { showAlteredToast } from "./components/toastUserPage";
import ConfirmDialog from "../../utils/Modal/ConfirmDialog";
import { showErrorToast } from "../../utils/notification/toastify";
import {
  onlyDigits,
  formatDocument,
  formatPhone,
} from "../../utils/format/format";
import {
  COUNCILS,
  formatRegistry,
  exampleRegistry,
  regionOptions,
} from "../../utils/format/councils";

const icons = {
  edit: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4",
  refresh: "M20 11a8 8 0 0 0-14.9-3.9M4 5v4h4M4 13a8 8 0 0 0 14.9 3.9M20 19v-4h-4",
  calendar:
    "M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z",
  message:
    "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8 10h8M8 13h5",
  check: "m5 12 5 5 9-10",
  image:
    "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9.5a1 1 0 1 0 0-.01",
  upload: "M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M7 9l5-5 5 5",
  warning: "M12 4 2.5 20h19L12 4ZM12 10v4M12 17h.01",
};

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

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
  </svg>
);

// Variáveis que o backend preenche (Handlebars) ao montar a mensagem de cada paciente
const messageVariables = [
  { key: "nome", label: "Nome", example: "Maria Silva" },
  { key: "mes", label: "Mês", example: "setembro" },
  { key: "dias", label: "Dias", example: "04, 11 e 18" },
  { key: "valor_total", label: "Valor total", example: "450,00" },
  { key: "clinic_name", label: "Clínica", example: "Consultório" },
];

const renderMessagePreview = (message, clinicName) =>
  messageVariables.reduce(
    (text, variable) =>
      text.replace(
        new RegExp(`{{\\s*${variable.key}\\s*}}`, "g"),
        variable.key === "clinic_name" && clinicName
          ? clinicName
          : variable.example
      ),
    message
  );

const UserPage = () => {
  const [userData, setUserData] = useState({
    user_name: "",
    user_email: "",
    user_cpf: "",
    user_cnpj: "",
    council_type: null,
    council_region: null,
    council_number: null,
    council_category: null,
    registry: null,
    user_phone: "",
    user_message: "",
    image: null,
  });

  const [draft, setDraft] = useState(null);
  const isEditing = draft !== null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState(new Set());
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [messageBackup, setMessageBackup] = useState("");
  const messageRef = useRef(null);
  const [fileName, setFileName] = useState("nomedoarquivo.png");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [activeCalendarId, setActiveCalendarId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [calendarToRemove, setCalendarToRemove] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Erro ao buscar os dados do usuário:", await response.text());
        return;
      }

      const data = await response.json();
      setUserData(data);
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchCalendars = async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/events/calendars`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setCalendars(data);

      const selected = new Set(
        data.filter((cal) => cal.enabled).map((cal) => cal.calendar_id)
      );
      setSelectedCalendars(selected);
    };

    fetchCalendars();
  }, [refreshKey]);

  const toggleCalendar = async (calendarId) => {
    const isEnabled = !selectedCalendars.has(calendarId);

    const calendar = calendars.find((cal) => cal.calendar_id === calendarId);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/calendars/selection/${calendarId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: isEnabled,
          calendar_name: calendar ? calendar.calendar_name : "default name",
        }),
      }
    );
    if (!response.ok) {
      return;
    }

    setSelectedCalendars((prevSelected) => {
      const updatedSelected = new Set(prevSelected);
      if (isEnabled) {
        updatedSelected.add(calendarId);
      } else {
        updatedSelected.delete(calendarId);
      }
      return updatedSelected;
    });

    setRefreshKey((prevKey) => prevKey + 1);
  };

  const removeCalendar = async (calendar) => {
    setCalendarToRemove(null);
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/calendars/${encodeURIComponent(
        calendar.calendar_id
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
      }
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      notify.error(body.error || "Não foi possível remover a agenda.");
      return;
    }
    notify.success(`Agenda "${calendar.calendar_name}" removida.`);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleChangeAccount = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/google`);
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Erro ao trocar de conta:", error);
    }
  };

  const openEdit = () => {
    setDraft({
      ...userData,
      user_document: formatDocument(userData.user_cpf || userData.user_cnpj),
      user_phone: formatPhone(userData.user_phone),
      council_type: userData.council_type || "CRP",
      council_region: userData.council_region || "",
      council_number: userData.council_number || "",
      council_category: userData.council_category || "",
    });
    setFileName("nomedoarquivo.png");
  };

  const closeEdit = () => setDraft(null);

  const handleSave = async () => {
    const documentDigits = onlyDigits(draft.user_document);
    if (![0, 11, 14].includes(documentDigits.length)) {
      showErrorToast("CPF deve ter 11 dígitos e CNPJ 14 dígitos.");
      return;
    }

    const phoneDigits = onlyDigits(draft.user_phone);
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      showErrorToast("Telefone incompleto. Informe DDD e número.");
      return;
    }

    // Registro profissional: número vazio = sem registro
    const council = COUNCILS[draft.council_type];
    const councilNumber = onlyDigits(draft.council_number);
    if (councilNumber) {
      const [min, max] = council.digits;
      if (!draft.council_region) {
        showErrorToast(
          council.region === "uf"
            ? `Escolha o estado do ${draft.council_type}.`
            : `Escolha a região do ${draft.council_type}.`
        );
        return;
      }
      if (council.categories && !draft.council_category) {
        showErrorToast(`Escolha a categoria do ${draft.council_type}.`);
        return;
      }
      if (councilNumber.length < min || councilNumber.length > max) {
        showErrorToast(
          `O número do ${draft.council_type} deve ter de ${min} a ${max} dígitos.`
        );
        return;
      }
    }

    const isCnpj = documentDigits.length === 14;

    try {
      const formData = new FormData();
      formData.append("user_cpf", isCnpj ? "" : documentDigits);
      formData.append("user_cnpj", isCnpj ? documentDigits : "");
      formData.append("council_type", draft.council_type);
      formData.append("council_region", draft.council_region || "");
      formData.append("council_number", councilNumber);
      formData.append(
        "council_category",
        council.categories ? draft.council_category || "" : ""
      );
      formData.append("user_phone", phoneDigits);
      formData.append("user_message", draft.user_message || "");
      formData.append("clinic_name", (draft.clinic_name || "").trim());

      if (draft.image instanceof File) {
        formData.append("image", draft.image);
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/save-users`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao salvar os dados do usuário.");
      }

      const updatedData = await response.json();
      setUserData((prevData) => ({
        ...prevData,
        user_cpf: updatedData.user_cpf,
        user_cnpj: updatedData.user_cnpj,
        council_type: updatedData.council_type,
        council_region: updatedData.council_region,
        council_number: updatedData.council_number,
        council_category: updatedData.council_category,
        registry: updatedData.registry,
        user_phone: updatedData.user_phone,
        user_message: updatedData.user_message,
        clinic_name: updatedData.clinic_name,
        image: updatedData.image,
      }));

      setDraft(null);
      showAlteredToast();
    } catch (error) {
      console.error(error);
      showErrorToast(
        error.message || "Não foi possível salvar. Tente novamente."
      );
    }
  };

  const saveMessage = async () => {
    try {
      const formData = new FormData();
      formData.append("user_message", userData.user_message || "");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/save-users`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao salvar a mensagem.");
      }

      const updatedData = await response.json();
      setUserData((prevData) => ({
        ...prevData,
        ...updatedData,
      }));

      setIsEditingMessage(false);
    } catch (error) {
      console.error("Erro ao salvar a mensagem:", error);
      notify.error("Erro ao salvar a mensagem. Tente novamente.");
    }
  };

  const startEditMessage = () => {
    setMessageBackup(userData.user_message || "");
    setIsEditingMessage(true);
  };

  // Insere a variável na posição do cursor
  const insertVariable = (key) => {
    const token = `{{${key}}}`;
    const textarea = messageRef.current;
    const current = userData.user_message || "";
    const start = textarea ? textarea.selectionStart : current.length;
    const end = textarea ? textarea.selectionEnd : current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setUserData((prevData) => ({ ...prevData, user_message: next }));
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const cancelEditMessage = () => {
    setUserData((prevData) => ({ ...prevData, user_message: messageBackup }));
    setIsEditingMessage(false);
  };

  const openModalToChangeAccount = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formatted =
      name === "user_document"
        ? formatDocument(value)
        : name === "user_phone"
        ? formatPhone(value)
        : name === "council_number"
        ? onlyDigits(value).slice(0, COUNCILS[draft.council_type].digits[1])
        : value;

    setDraft((prevDraft) => ({
      ...prevDraft,
      [name]: formatted,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDraft((prevDraft) => ({
      ...prevDraft,
      image: file,
    }));
    setFileName(file ? file.name : "");
  };

  const openConfirmationModal = (calendarId) => {
    setActiveCalendarId(calendarId);
    setIsConfirmationModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setActiveCalendarId(null);
  };

  const handleToggleCalendar = (calendarId) => {
    toggleCalendar(calendarId);
    closeConfirmationModal();
  };

  useEscapeKey(isModalOpen, closeModal);
  useEscapeKey(isConfirmationModalOpen, closeConfirmationModal);
  useEscapeKey(isEditing, closeEdit);
  useEscapeKey(calendarToRemove !== null, () => setCalendarToRemove(null));

  const labelClass =
    "mb-1.5 ml-1 block text-sm font-semibold text-texto2";
  const inputClass =
    "h-[46px] w-full rounded-xl border border-cinza6 bg-bg1 px-4 text-base font-openSans sm:text-sm text-texto1 transition focus:border-primaria/60 focus:outline-none focus:ring-4 focus:ring-clara3";
  const disabledInputClass = `${inputClass} cursor-not-allowed bg-clara4 text-texto3`;
  const cardClass =
    "min-w-0 rounded-2xl border border-cinza9 bg-bg1 p-5 shadow-card md:p-6";
  const pillButtonClass =
    "inline-flex h-9 items-center gap-2 rounded-full border border-cinza9 bg-bg1 px-4 text-sm font-semibold text-primaria shadow-card transition hover:border-primaria/40 hover:bg-clara4 active:scale-[0.98]";
  const primaryButtonClass =
    "inline-flex h-9 items-center gap-2 rounded-full bg-primaria px-4 text-sm font-semibold text-white shadow-card transition hover:opacity-90 active:scale-[0.98]";

  const documentNumber = formatDocument(userData.user_cpf || userData.user_cnpj);
  // Registro no formato do conselho; sem região, avisa que falta escolher
  const registryLabel = userData.council_type || "Registro profissional";
  const registry = userData.council_number
    ? userData.council_region
      ? userData.registry
      : `${userData.council_number} · falta a região`
    : "";
  const phone = formatPhone(userData.user_phone);
  const logoUrl =
    typeof userData.image === "string" && userData.image
      ? `${process.env.REACT_APP_API_URL}${userData.image}`
      : null;
  const googleCalendars = calendars.filter((cal) => !cal.missing);
  const missingCalendars = calendars.filter((cal) => cal.missing);
  const enabledCount = googleCalendars.filter((cal) =>
    selectedCalendars.has(cal.calendar_id)
  ).length;

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

  const SectionTitle = ({ icon, title, subtitle, action }) => (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clara3 text-primaria">
          <Icon d={icon} />
        </span>
        <div className="min-w-0">
          <h2 className="font-ubuntu text-lg font-bold tracking-tight text-texto1">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-texto3">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );

  return (
    <div className="w-full px-4 pb-8 pt-24 md:px-6 md:pt-28">
      <div className="mx-auto flex w-full max-w-[1076px] flex-col gap-4 md:gap-6">
        {/* Perfil */}
        <div className="overflow-hidden rounded-2xl border border-cinza9 bg-bg1 shadow-card">
          <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primaria to-primariaEscura md:h-28">
            <span className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-destaque/40 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="px-5 pb-5 md:px-6 md:pb-6">
            <div className="relative -mt-8 flex flex-wrap items-end justify-between gap-4 md:-mt-9">
              <div className="flex min-w-0 items-end gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-bg1 bg-gradient-to-br from-destaque to-primaria shadow-card md:h-24 md:w-24">
                  {userData.photoUrl ? (
                    <img
                      src={userData.photoUrl}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-ubuntu text-3xl font-bold text-white md:text-4xl">
                      {userData.user_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <h2 className="break-words font-ubuntu text-xl font-bold tracking-tight text-texto1 md:text-2xl">
                    {userData.user_name}
                  </h2>
                  <p className="text-sm text-texto3 [overflow-wrap:anywhere]">
                    {userData.user_email}
                  </p>
                </div>
              </div>
              <button onClick={openEdit} className={primaryButtonClass}>
                <Icon d={icons.edit} className="h-4 w-4" />
                Editar dados
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="min-w-0">
                <h3 className="mb-3 text-sm font-semibold text-texto2">
                  Meus dados
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Info label="CPF/CNPJ" value={documentNumber} />
                  <Info label={registryLabel} value={registry} />
                  <Info
                    label="Telefone"
                    value={phone}
                    className="col-span-2"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="mb-3 text-sm font-semibold text-texto2">
                  Dados para recibo
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Info
                    label="Nome/Clínica"
                    value={userData.clinic_name}
                    className="col-span-2"
                  />
                  <Info label="CPF/CNPJ" value={documentNumber} />
                  <Info label={registryLabel} value={registry} />
                  <div className="col-span-2 flex min-w-0 items-center gap-3 rounded-xl bg-clara4 px-4 py-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cinza9 bg-bg1 text-texto3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logotipo"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Icon d={icons.image} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-texto3">
                        Logotipo
                      </p>
                      <p
                        className={`text-[15px] ${
                          logoUrl ? "font-semibold text-texto1" : "italic text-texto3"
                        }`}
                      >
                        {logoUrl ? "Logotipo enviado" : "Nenhum logotipo enviado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          {/* Minhas agendas */}
          <div className={cardClass}>
            <SectionTitle
              icon={icons.calendar}
              title="Minhas agendas"
              subtitle="Só as agendas ativas entram no dashboard"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cinza9 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg1 shadow-card">
                  <GoogleIcon />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-texto1">
                    {userData.user_name}
                  </p>
                  <p className="truncate text-xs text-texto3">
                    {userData.user_email}
                  </p>
                </div>
              </div>
              <button
                onClick={openModalToChangeAccount}
                className={pillButtonClass}
              >
                <Icon d={icons.refresh} className="h-4 w-4" />
                Trocar conta
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-texto2">
                Agendas do Google
              </h3>
              {googleCalendars.length > 0 && (
                <span className="rounded-full bg-clara3 px-2.5 py-0.5 text-xs font-semibold text-primaria">
                  {enabledCount} de {googleCalendars.length} ativas
                </span>
              )}
            </div>

            <ul className="mt-2 max-h-[232px] space-y-1 overflow-y-auto pr-1">
              {googleCalendars.map((calendar) => {
                const active = selectedCalendars.has(calendar.calendar_id);
                return (
                  <li key={calendar.calendar_id}>
                    <label className="relative flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-clara4">
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            active ? "bg-sucesso" : "bg-cinza6"
                          }`}
                        />
                        <span
                          className={`min-w-0 break-words text-sm ${
                            active ? "font-semibold text-texto1" : "text-texto3"
                          }`}
                        >
                          {calendar.calendar_name}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={active}
                        onChange={() =>
                          openConfirmationModal(calendar.calendar_id)
                        }
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`relative h-6 w-11 shrink-0 rounded-full transition peer-focus-visible:ring-4 peer-focus-visible:ring-clara3 ${
                          active ? "bg-primaria" : "bg-cinza6"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            active ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </span>
                    </label>
                  </li>
                );
              })}
              {googleCalendars.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-texto3">
                  Nenhuma agenda encontrada.
                </li>
              )}
            </ul>

            {missingCalendars.length > 0 && (
              <div className="mt-4 rounded-xl border border-aviso/40 bg-aviso/10 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-texto1">
                  <Icon d={icons.warning} className="h-4 w-4 text-aviso" />
                  Não encontradas no Google
                </p>
                <p className="mt-0.5 text-xs text-texto2">
                  Foram apagadas no Google ou são de outra conta.
                </p>
                <ul className="mt-2 space-y-1">
                  {missingCalendars.map((calendar) => (
                    <li
                      key={calendar.calendar_id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-bg1 px-3 py-2"
                    >
                      <span className="min-w-0 break-words text-sm font-semibold text-texto1">
                        {calendar.calendar_name}
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            calendar.enabled
                              ? "bg-aviso/20 text-texto1"
                              : "bg-clara4 text-texto3"
                          }`}
                        >
                          {calendar.enabled ? "Ativa" : "Desativada"}
                        </span>
                      </span>
                      <span className="flex gap-1">
                        {calendar.enabled && (
                          <button
                            onClick={() =>
                              openConfirmationModal(calendar.calendar_id)
                            }
                            className="rounded-full px-3 py-1 text-xs font-semibold text-primaria hover:bg-clara4"
                          >
                            Desativar
                          </button>
                        )}
                        <button
                          onClick={() => setCalendarToRemove(calendar)}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-erro hover:bg-erro/5"
                        >
                          Remover
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Mensagem de cobrança */}
          <div className={`flex flex-col ${cardClass}`}>
            <SectionTitle
              icon={icons.message}
              title="Mensagem de cobrança"
              subtitle="Enviada pelo WhatsApp em “Enviar cobrança”"
              action={
                !isEditingMessage && (
                  <button onClick={startEditMessage} className={pillButtonClass}>
                    <Icon d={icons.edit} className="h-4 w-4" />
                    Editar
                  </button>
                )
              }
            />

            {isEditingMessage ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs font-semibold text-texto3">
                    Inserir:
                  </span>
                  {messageVariables.map((variable) => (
                    <button
                      key={variable.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertVariable(variable.key)}
                      title={`Insere {{${variable.key}}}`}
                      className="rounded-full border border-cinza9 bg-clara4 px-2.5 py-1 text-xs font-semibold text-primaria transition hover:border-primaria/40 hover:bg-clara3"
                    >
                      + {variable.label}
                    </button>
                  ))}
                </div>
                <textarea
                  name="user_message"
                  value={userData.user_message || ""}
                  onChange={(e) =>
                    setUserData((prevData) => ({
                      ...prevData,
                      [e.target.name]: e.target.value,
                    }))
                  }
                  ref={messageRef}
                  autoFocus
                  className="min-h-[200px] w-full flex-1 resize-none rounded-xl border border-cinza6 bg-bg1 p-4 text-[15px] text-texto1 transition focus:border-primaria/60 focus:outline-none focus:ring-4 focus:ring-clara3"
                  placeholder="Escreva sua mensagem de cobrança aqui..."
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-texto3">
                    {(userData.user_message || "").length} caracteres
                  </span>
                  <div className="flex gap-2">
                    <button onClick={cancelEditMessage} className={pillButtonClass}>
                      Cancelar
                    </button>
                    <button onClick={saveMessage} className={primaryButtonClass}>
                      <Icon d={icons.check} className="h-4 w-4" />
                      Salvar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[200px] flex-1 flex-col rounded-xl bg-clara4 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-texto3">
                  Prévia com dados de exemplo
                </p>
                {userData.user_message ? (
                  <div className="relative max-w-[92%] self-start whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-bg1 px-4 py-3 text-[15px] text-texto1 shadow-card">
                    {renderMessagePreview(
                      userData.user_message,
                      userData.clinic_name
                    )}
                  </div>
                ) : (
                  <button
                    onClick={startEditMessage}
                    className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-cinza6 text-sm text-texto3 hover:border-primaria/40 hover:text-primaria"
                  >
                    Nenhuma mensagem ainda — clique para escrever
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ConfirmDialog
          tone="warning"
          icon={icons.refresh}
          title="Trocar de conta Google?"
          confirmLabel="Trocar conta"
          onCancel={closeModal}
          onConfirm={() => {
            closeModal();
            handleChangeAccount();
          }}
        >
          Você será levado ao Google para entrar com outra conta. As agendas
          da conta atual deixam de ser encontradas no Google.
        </ConfirmDialog>
      )}

      {isConfirmationModalOpen && (
        <ConfirmDialog
          icon={icons.calendar}
          title={
            selectedCalendars.has(activeCalendarId)
              ? "Desativar agenda?"
              : "Ativar agenda?"
          }
          confirmLabel={
            selectedCalendars.has(activeCalendarId) ? "Desativar" : "Ativar"
          }
          onCancel={closeConfirmationModal}
          onConfirm={() => handleToggleCalendar(activeCalendarId)}
        >
          <strong className="text-texto1">
            {calendars.find((cal) => cal.calendar_id === activeCalendarId)
              ?.calendar_name}
          </strong>{" "}
          {selectedCalendars.has(activeCalendarId)
            ? "deixa de ser sincronizada e sai do dashboard e dos seletores. O histórico é mantido."
            : "passa a ser sincronizada e entra no dashboard."}
        </ConfirmDialog>
      )}

      {calendarToRemove && (
        <ConfirmDialog
          tone="danger"
          title="Remover agenda?"
          confirmLabel="Remover"
          onCancel={() => setCalendarToRemove(null)}
          onConfirm={() => removeCalendar(calendarToRemove)}
        >
          <strong className="text-texto1">
            {calendarToRemove.calendar_name}
          </strong>{" "}
          será removida do Psicontrol. Nada é alterado no Google Agenda.
        </ConfirmDialog>
      )}

      {isEditing && (
        <div
          onClick={closeOnBackdrop(closeEdit)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bgM/30 p-4 backdrop-blur-[6px]"
        >
          <div className="flex max-h-[92vh] w-full max-w-[920px] animate-toast-in flex-col overflow-hidden rounded-2xl border border-cinza9 bg-bg1 shadow-dropShadow">
            <div className="flex items-center justify-between border-b border-cinza9 px-5 py-4 md:px-8">
              <h2 className="font-ubuntu text-lg font-bold tracking-tight text-texto1 md:text-xl">
                Editar dados
              </h2>
              <button
                onClick={closeEdit}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-texto3 hover:bg-clara4 hover:text-primaria"
              >
                <Icon d="M6 6l12 12M18 6 6 18" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 overflow-y-auto px-5 py-6 md:grid-cols-2 md:gap-10 md:px-8">
              <div className="min-w-0 space-y-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-texto3">
                  Meus dados
                </h3>

                <div>
                  <label className={labelClass}>Nome</label>
                  <input
                    type="text"
                    value={draft.user_name || ""}
                    disabled
                    title="Vem da sua conta Google"
                    className={disabledInputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>E-mail</label>
                  <input
                    type="email"
                    value={draft.user_email || ""}
                    disabled
                    title="Vem da sua conta Google"
                    className={disabledInputClass}
                  />
                  <p className="ml-1 mt-1 text-xs text-texto3">
                    Nome e e-mail vêm da sua conta Google.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Telefone</label>
                    <input
                      type="text"
                      name="user_phone"
                      value={draft.user_phone || ""}
                      onChange={handleChange}
                      placeholder="(00) 0 0000-0000"
                      inputMode="tel"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>CPF/CNPJ</label>
                    <input
                      type="text"
                      name="user_document"
                      value={draft.user_document || ""}
                      onChange={handleChange}
                      placeholder="CPF ou CNPJ"
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </div>
                </div>

                <fieldset className="rounded-2xl border border-cinza9 bg-clara4/60 p-4">
                  <legend className="px-1 text-sm font-semibold text-texto2">
                    Registro profissional
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label htmlFor="council_type" className={labelClass}>
                        Conselho
                      </label>
                      <select
                        id="council_type"
                        value={draft.council_type}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            council_type: e.target.value,
                            // Região e categoria dependem do conselho
                            council_region: "",
                            council_category: "",
                            council_number: onlyDigits(prev.council_number).slice(
                              0,
                              COUNCILS[e.target.value].digits[1]
                            ),
                          }))
                        }
                        className={inputClass}
                      >
                        {Object.entries(COUNCILS).map(([id, council]) => (
                          <option key={id} value={id}>
                            {council.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="council_region" className={labelClass}>
                        {COUNCILS[draft.council_type].region === "uf"
                          ? "Estado"
                          : "Região"}
                      </label>
                      <select
                        id="council_region"
                        name="council_region"
                        value={draft.council_region}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="">Escolha</option>
                        {regionOptions(draft.council_type).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="council_number" className={labelClass}>
                        Número
                      </label>
                      <input
                        id="council_number"
                        type="text"
                        name="council_number"
                        inputMode="numeric"
                        value={draft.council_number}
                        onChange={handleChange}
                        placeholder={"0".repeat(
                          Math.min(COUNCILS[draft.council_type].digits[1], 6)
                        )}
                        className={inputClass}
                      />
                    </div>

                    {COUNCILS[draft.council_type].categories && (
                      <div className="col-span-2">
                        <label htmlFor="council_category" className={labelClass}>
                          Categoria
                        </label>
                        <select
                          id="council_category"
                          name="council_category"
                          value={draft.council_category}
                          onChange={handleChange}
                          className={inputClass}
                        >
                          <option value="">Escolha</option>
                          {COUNCILS[draft.council_type].categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label} ({c.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto3">
                    Vai aparecer assim:
                    <span className="rounded-full bg-bg1 px-2.5 py-1 font-semibold text-texto1 shadow-card">
                      {formatRegistry({
                        type: draft.council_type,
                        region: draft.council_region,
                        number: draft.council_number,
                        category: draft.council_category,
                      }) || exampleRegistry(draft.council_type)}
                    </span>
                  </p>
                </fieldset>
              </div>

              <div className="min-w-0 space-y-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-texto3">
                  Dados para recibo
                </h3>

                <div>
                  <label className={labelClass}>Nome/Clínica</label>
                  <input
                    type="text"
                    name="clinic_name"
                    maxLength={255}
                    value={draft.clinic_name || ""}
                    onChange={handleChange}
                    placeholder="Nome/Clínica"
                    className={inputClass}
                  />
                </div>

                <div className="sm:w-1/2 sm:pr-2">
                  <label className={labelClass}>CPF/CNPJ</label>
                  <input
                    type="text"
                    value={draft.user_document || ""}
                    disabled
                    className={disabledInputClass}
                  />
                  <p className="ml-1 mt-1 text-xs text-texto3">
                    O recibo usa o mesmo CPF/CNPJ de "Meus dados".
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Logotipo</label>
                  <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-cinza6 p-4 transition hover:border-primaria/50 hover:bg-clara4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clara3 text-primaria">
                      <Icon d={icons.upload} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-texto1">
                        {draft.image instanceof File
                          ? fileName
                          : "Escolher imagem"}
                      </span>
                      <span className="block text-xs text-texto3">
                        {draft.image instanceof File
                          ? "Clique para trocar"
                          : "PNG ou JPG"}
                      </span>
                    </span>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-cinza9 px-5 py-4 md:px-8">
              <button onClick={closeEdit} className={pillButtonClass}>
                Cancelar
              </button>
              <button onClick={handleSave} className={primaryButtonClass}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
