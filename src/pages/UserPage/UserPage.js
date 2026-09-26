import { closeOnBackdrop, useEscapeKey } from "../../utils/Modal/useDismiss";
import React, { useState, useEffect } from "react";
import { CheckMessage, EditIcon, RefreshIcon } from "../../icons/icons";
import { showAlteredToast } from "./components/toastUserPage";
import { showErrorToast } from "../../utils/notification/toastify";
import {
  onlyDigits,
  formatDocument,
  formatCrp,
  formatPhone,
} from "../../utils/format/format";

const UserPage = () => {
  const [userData, setUserData] = useState({
    user_name: "",
    user_email: "",
    user_cpf: "",
    user_cnpj: "",
    crp_number: "",
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
  const [fileName, setFileName] = useState("nomedoarquivo.png");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [activeCalendarId, setActiveCalendarId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

    const calendar = calendars.find((cal) => cal.id === calendarId);

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
          calendar_name: calendar ? calendar.summary : "default name",
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
      crp_number: formatCrp(userData.crp_number),
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

    const crpDigits = onlyDigits(draft.crp_number);
    if (crpDigits.length > 0 && crpDigits.length < 6) {
      showErrorToast("CRP incompleto. Use o formato XX/XXXXX.");
      return;
    }

    const isCnpj = documentDigits.length === 14;

    try {
      const formData = new FormData();
      formData.append("user_cpf", isCnpj ? "" : documentDigits);
      formData.append("user_cnpj", isCnpj ? documentDigits : "");
      formData.append("crp_number", formatCrp(draft.crp_number));
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
        crp_number: updatedData.crp_number,
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
      alert("Erro ao salvar a mensagem. Tente novamente.");
    }
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
        : name === "crp_number"
        ? formatCrp(value)
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

  const infoLineClass = "mt-2 text-base md:text-[17px] font-normal tracking-tight text-texto1";
  const infoValueClass = "break-words text-texto2";
  const labelClass =
    "mb-1 block text-sm md:text-base font-normal font-['Open Sans'] tracking-wide text-texto1";
  const inputClass =
    "h-[50px] w-full rounded-[15px] border-2 border-cinza6 bg-neutral-100 px-[16px] text-sm font-normal font-['Open Sans'] text-texto2 focus:outline-none focus:ring";
  const boxClass =
    "min-w-0 rounded-[25px] border-2 border-cinza6 bg-bg1 p-5 shadow md:p-6";

  const ConfirmModal = ({ children, onCancel, onConfirm }) => (
    <div
      onClick={closeOnBackdrop(onCancel)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bgM/30 p-4 backdrop-blur-[6px]">
      <div className="w-full max-w-[335px] rounded-lg border-2 border-cinza6 bg-white p-6 shadow-lg">
        <p className="mb-8 text-center text-lg md:text-[21px] font-medium font-['Ubuntu'] tracking-tight text-texto2">
          {children}
        </p>
        <div className="flex justify-around">
          <button
            onClick={onCancel}
            className="h-10 w-[100px] rounded-full border border-primaria bg-white text-center font-semibold text-primaria hover:bg-clara4"
          >
            Não
          </button>
          <button
            onClick={onConfirm}
            className="h-10 w-[100px] rounded-full bg-primaria text-center font-semibold text-white hover:opacity-90"
          >
            Sim
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 pb-8 pt-32 md:px-6 md:pt-28">
      <div className="mx-auto flex w-full max-w-[1076px] flex-col gap-4 md:gap-6">
        {/* Meus dados */}
        <div className={`relative ${boxClass}`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-lg md:text-[25px] font-medium font-['Ubuntu'] text-primaria">
              Meus dados
            </h2>
            <button
              onClick={openEdit}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-primaria underline drop-shadow-editShadow hover:bg-clara3"
            >
              Editar dados
              <EditIcon />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            {/* Primeira coluna */}
            <div className="flex min-w-0 gap-4">
              <div className="flex aspect-square h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bgM">
                {userData.photoUrl ? (
                  <img
                    src={userData.photoUrl}
                    alt="Foto de perfil"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {userData.user_name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 break-words text-xl font-medium font-['Ubuntu'] text-black">
                  {userData.user_name}
                </div>
                <div className={infoLineClass}>
                  <span>CPF/CNPJ: </span>
                  <span className={infoValueClass}>
                    {formatDocument(userData.user_cpf || userData.user_cnpj)}
                  </span>
                </div>
                <div className={infoLineClass}>
                  <span>CRP: </span>
                  <span className={infoValueClass}>
                    {formatCrp(userData.crp_number)}
                  </span>
                </div>
                <div className={infoLineClass}>
                  <span>E-mail: </span>
                  <span className={`${infoValueClass} [overflow-wrap:anywhere]`}>
                    {userData.user_email}
                  </span>
                </div>
                <div className={infoLineClass}>
                  <span>Telefone: </span>
                  <span className={infoValueClass}>
                    {formatPhone(userData.user_phone)}
                  </span>
                </div>
              </div>
            </div>

            {/* Segunda coluna */}
            <div className="min-w-0 border-t border-cinza9 pt-6 md:border-t-0 md:pt-0">
              <div className="mb-2 text-xl font-medium font-['Ubuntu'] text-black">
                Dados para recibo
              </div>
              <div className={infoLineClass}>
                <span>Nome/Clínica: </span>
                <span className={infoValueClass}>{userData.clinic_name}</span>
              </div>
              <div className={infoLineClass}>
                <span>CPF/CNPJ: </span>
                <span className={infoValueClass}>
                  {formatDocument(userData.user_cpf || userData.user_cnpj)}
                </span>
              </div>
              <div className={infoLineClass}>
                <span>CRP: </span>
                <span className={infoValueClass}>
                    {formatCrp(userData.crp_number)}
                  </span>
              </div>
              <div className={infoLineClass}>
                <span>Logo: </span>
                <span className={`${infoValueClass} break-all`}>
                  {userData.image
                    ? userData.image instanceof File
                      ? userData.image.name
                      : typeof userData.image === "string" &&
                        userData.image.includes("/")
                      ? userData.image.split("/").pop()
                      : userData.image
                    : "(Imagem não carregada)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          {/* Minhas agendas */}
          <div className={boxClass}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg md:text-[20px] font-medium text-primaria">
                Minhas agendas
              </h3>
              <button
                onClick={openModalToChangeAccount}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-primaria underline drop-shadow-editShadow hover:bg-clara3"
              >
                Trocar de conta
                <RefreshIcon />
              </button>
            </div>

            <div className="mt-6 md:px-4">
              <p className="break-words font-semibold">{userData.user_name}</p>
              <p className="text-texto3 [overflow-wrap:anywhere]">
                <span className="text-texto2">E-mail:</span>{" "}
                {userData.user_email}
              </p>

              <h4 className="mt-6 text-lg font-medium text-texto1">
                Agendas sincronizadas
              </h4>

              <div className="mt-3 max-h-[160px] space-y-4 overflow-y-auto pr-2">
                {calendars.map((calendar) => (
                  <label
                    key={calendar.calendar_id}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCalendars.has(calendar.calendar_id)}
                      onChange={() =>
                        openConfirmationModal(calendar.calendar_id)
                      }
                      className={`h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border-2 transition-colors ${
                        selectedCalendars.has(calendar.calendar_id)
                          ? "border-primaria bg-primaria shadow-inner"
                          : "border-gray-300 bg-white opacity-50"
                      }`}
                      style={{
                        boxShadow: selectedCalendars.has(calendar.calendar_id)
                          ? "inset 0 0 0 3px white"
                          : "none",
                      }}
                    />
                    <span
                      className={`min-w-0 break-words font-medium ${
                        selectedCalendars.has(calendar.calendar_id)
                          ? "text-texto2"
                          : "text-gray-500 opacity-50"
                      }`}
                    >
                      {calendar.calendar_name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Mensagem de cobrança */}
          <div className={`flex flex-col ${boxClass}`}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg md:text-[20px] font-medium text-primaria">
                Mensagem de cobrança
              </h3>
              {isEditingMessage ? (
                <button
                  onClick={saveMessage}
                  className="rounded-full p-2 text-sm text-primaria hover:bg-clara3"
                  aria-label="Salvar mensagem"
                >
                  <CheckMessage />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingMessage(true)}
                  className="rounded-full p-2 text-sm text-primaria underline drop-shadow-editShadow hover:bg-clara3"
                  aria-label="Editar mensagem"
                >
                  <EditIcon />
                </button>
              )}
            </div>

            {isEditingMessage ? (
              <textarea
                name="user_message"
                value={userData.user_message || ""}
                onChange={(e) =>
                  setUserData((prevData) => ({
                    ...prevData,
                    [e.target.name]: e.target.value,
                  }))
                }
                className="h-[250px] w-full resize-none overflow-y-auto rounded-md border border-gray-300 bg-white p-4 text-[15px] text-texto1"
                placeholder="Escreva sua mensagem de cobrança aqui..."
              />
            ) : (
              <div className="h-[250px] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-gray-300 bg-white p-4 text-[15px] text-texto1">
                {userData.user_message || (
                  <span className="text-gray-400">
                    Escreva sua mensagem de cobrança aqui...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ConfirmModal
          onCancel={closeModal}
          onConfirm={() => {
            closeModal();
            handleChangeAccount();
          }}
        >
          Você tem certeza que deseja
          <span className="text-primaria"> trocar de conta?</span>
        </ConfirmModal>
      )}

      {isConfirmationModalOpen && (
        <ConfirmModal
          onCancel={closeConfirmationModal}
          onConfirm={() => handleToggleCalendar(activeCalendarId)}
        >
          Você tem certeza que deseja{" "}
          <span className="text-primaria">
            {selectedCalendars.has(activeCalendarId)
              ? "desativar a agenda?"
              : "ativar a agenda?"}
          </span>
        </ConfirmModal>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgM/30 p-4 backdrop-blur-[6px]">
          <div className="max-h-[92vh] w-full max-w-[1076px] overflow-y-auto rounded-[15px] border-2 border-cinza6 bg-neutral-100 p-5 shadow-lg md:p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 md:px-4">
              <div className="min-w-0 space-y-6">
                <h2 className="text-lg md:text-[25px] font-medium font-['Ubuntu'] text-primaria">
                  Editar meus dados
                </h2>

                <div>
                  <label className={labelClass}>Nome</label>
                  <input
                    type="text"
                    value={draft.user_name || ""}
                    disabled
                    title="Vem da sua conta Google"
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                  />
                </div>

                <div>
                  <label className={labelClass}>E-mail</label>
                  <input
                    type="email"
                    value={draft.user_email || ""}
                    disabled
                    title="Vem da sua conta Google"
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                  />
                  <p className="ml-2 mt-1 text-xs text-texto3">
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

                <div className="sm:w-1/2 sm:pr-2">
                  <label className={labelClass}>CRP</label>
                  <input
                    type="text"
                    name="crp_number"
                    inputMode="numeric"
                    value={draft.crp_number || ""}
                    onChange={handleChange}
                    placeholder="XX/XXXXX"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="min-w-0 space-y-6">
                <h2 className="text-lg md:text-[25px] font-medium font-['Ubuntu'] text-primaria">
                  Dados para recibo
                </h2>

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
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                  />
                  <p className="ml-2 mt-1 text-xs text-texto3">
                    O recibo usa o mesmo CPF/CNPJ de "Meus dados".
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Importar logotipo</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-[50px] min-w-0 flex-1 items-center rounded-[15px] border-2 border-cinza6 bg-neutral-100 px-[16px] sm:max-w-[260px]">
                      <span className="truncate text-sm font-normal font-['Open Sans'] text-texto2/70">
                        {fileName}
                      </span>
                    </div>
                    <label className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-primaria hover:bg-clara3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"
                        />
                      </svg>
                      <span className="underline">Importar arquivo</span>
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
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={closeEdit}
                className="h-[39px] w-[108px] rounded-[100px] border border-primaria text-primaria hover:bg-clara4"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="h-[40px] w-[90px] rounded-[100px] bg-primaria text-white hover:opacity-90"
              >
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
