import React, { useState, useEffect } from "react";
import { registerLocale } from "react-datepicker";
import {
  formatDateBrazilian,
  parseISODate,
  isValidDate,
} from "../../../utils/DateOfBirth/dateOfBirth";
import { ptBR } from "date-fns/locale";
import { AddIcon, Trash } from "../../../icons/icons";
import "../../../index.css";
import { showErrorToast } from "../../../utils/notification/toastify";
import { showEditToast } from "../components/notiificationCustomerPage";
import {
  createOrUpdateCustomer,
  fetchSavedCalendars,
} from "../../../service/pagesService/pagesService";
import { showSuccessToast } from "../components/notiificationCustomerPage";
import {
  onlyDigits,
  formatDocument,
  formatPhone,
} from "../../../utils/format/format";

// Campos guardados só com dígitos; a máscara é aplicada apenas na exibição.
const DIGIT_FIELDS = {
  customer_cpf_cnpj: 14,
  alternative_cpf_cnpj: 14,
  customer_phone: 11,
};

registerLocale(ptBR);

export const UsePatientDataButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="h-[52px] w-[181px] rounded-[10px] border-2 border-primaria bg-bg1 text-center text-sm font-medium font-ubuntu tracking-tight text-primaria hover:bg-clara4"
  >
    Usar dados do <br /> paciente
  </button>
);

const CreateCustomerForm = ({
  onClose,
  onSubmit,
  selectedPatient,
  customer,
  setCustomer,
  isEditing,
  receiptHeader,
}) => {
  const [additionalAlternatives, setAdditionalAlternatives] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    fetchSavedCalendars()
      .then(setCalendars)
      .catch(() => setCalendars([]));
  }, []);

  // Habilitados + o calendário atual do paciente (mesmo que desabilitado)
  const calendarOptions = calendars.filter(
    (cal) => cal.enabled || cal.calendar_id === customer.calendar_id
  );
  const enabledCount = calendars.filter((cal) => cal.enabled).length;

  // Com um único calendário habilitado, já deixa ele selecionado
  useEffect(() => {
    const enabled = calendars.filter((cal) => cal.enabled);
    if (!isEditing && !customer.calendar_id && enabled.length === 1) {
      setCustomer((prev) => ({ ...prev, calendar_id: enabled[0].calendar_id }));
    }
  }, [calendars, isEditing, customer.calendar_id, setCustomer]);

  useEffect(() => {
    if (isEditing && selectedPatient && selectedPatient.customer_dob) {
      const parsedDate = parseISODate(selectedPatient.customer_dob);
      setStartDate(parsedDate);
      setCustomer((prev) => ({
        ...prev,
        ...selectedPatient,
        customer_dob: formatDateBrazilian(parsedDate),
      }));
    }
  }, [isEditing, selectedPatient, setCustomer]);

  const handleManualDateChange = (value) => {
    let formattedValue = value.replace(/\D/g, "");

    if (formattedValue.length === 0) {
      setCustomer((prevState) => ({
        ...prevState,
        customer_dob: "",
      }));
      return;
    }

    if (formattedValue.length > 2 && formattedValue.length <= 4) {
      formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2)}`;
    } else if (formattedValue.length > 4) {
      formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2, 4)}/${formattedValue.slice(4, 8)}`;
    }

    setCustomer((prevState) => ({
      ...prevState,
      customer_dob: formattedValue,
    }));

    if (formattedValue.length === 10) {
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;

      if (regex.test(formattedValue)) {
        const [day, month, year] = formattedValue.split("/").map(Number);
        const date = new Date(year, month - 1, day);

        if (year < 1900 || year > new Date().getFullYear()) {
          showErrorToast("Data inválida");
          return;
        }

        if (
          isValidDate(date) &&
          date.getDate() === day &&
          date.getMonth() === month - 1 &&
          date.getFullYear() === year
        ) {
          setStartDate(date);
        } else {
          showErrorToast("Data inválida! Verifique se a data existe.");
        }
      } else {
        showErrorToast("Data inválida! Use o formato DD/MM/AAAA.");
      }
    }
  };

  const handleAddAlternativeFields = () => {
    if (additionalAlternatives.length < 2) {
      setAdditionalAlternatives((prev) => [
        ...prev,
        { alternative_name: "", alternative_cpf_cnpj: "" },
      ]);
    }
  };

  const handleAlternativeChange = (index, name, value) => {
    const updatedAlternatives = additionalAlternatives.map((alt, i) =>
      i === index ? { ...alt, [name]: value } : alt
    );
    setAdditionalAlternatives(updatedAlternatives);
  };

  const handleDeleteAlternativeCPF = (index) => {
    const updatedAlternatives = additionalAlternatives.filter(
      (_, i) => i !== index
    );
    setAdditionalAlternatives(updatedAlternatives);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue =
      type === "checkbox"
        ? checked
        : name in DIGIT_FIELDS
        ? onlyDigits(value).slice(0, DIGIT_FIELDS[name])
        : value;

    setCustomer((prevState) => ({
      ...prevState,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !startDate ||
      startDate.getFullYear() < 1900 ||
      startDate.getFullYear() > new Date().getFullYear()
    ) {
      showErrorToast("Informe uma data de nascimento válida.");
      return;
    }

    if (!customer.calendar_id) {
      showErrorToast("Selecione o calendário do paciente.");
      return;
    }

    const isValidDocument = (value) =>
      [11, 14].includes(onlyDigits(value).length);

    if (!isValidDocument(customer.customer_cpf_cnpj)) {
      showErrorToast("CPF deve ter 11 dígitos e CNPJ 14 dígitos.");
      return;
    }
    if (
      customer.alternative_cpf_cnpj &&
      !isValidDocument(customer.alternative_cpf_cnpj)
    ) {
      showErrorToast("CPF/CNPJ do recibo deve ter 11 ou 14 dígitos.");
      return;
    }
    if (
      customer.customer_phone &&
      onlyDigits(customer.customer_phone).length < 10
    ) {
      showErrorToast("Telefone incompleto. Informe DDD e número.");
      return;
    }


    try {
      const payload = { ...customer };
      Object.keys(DIGIT_FIELDS).forEach((field) => {
        if (payload[field]) payload[field] = onlyDigits(payload[field]);
      });

      const response = await createOrUpdateCustomer(
        payload,
        additionalAlternatives,
        customer.customer_id
      );
      const data = await response.json();

      if (response.ok) {
        setCustomer({
          customer_name: "",
          customer_cpf_cnpj: "",
          customer_phone: "",
          customer_email: "",
          consultation_fee: "",
          patient_status: true,
          alternative_name: "",
          alternative_cpf_cnpj: "",
          customer_dob: "",
          calendar_id: "",
        });
        setAdditionalAlternatives([]);
        onSubmit();
        onClose();

        if (customer.customer_id) {
          showEditToast();
        } else {
          showSuccessToast();
        }

        setStartDate(null);
      } else {
        showErrorToast(
          data.error || data.message || "Erro ao processar a solicitação!"
        );
      }
    } catch (error) {
      showErrorToast("Erro ao processar a solicitação!");
    }
  };

  return (
    <div className="w-full space-y-2 pt-4 md:p-6">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 md:grid-cols-2 w-full"
      >
        <div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label className="mb-1 ml-3 block text-base font-normal font-openSans tracking-wide text-texto1">
                  Nome
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={customer.customer_name || ""}
                  onChange={handleChange}
                  placeholder="Nome do paciente"
                  required
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 ml-2 block text-base font-normal font-openSans tracking-wide text-texto1">
                  Nascimento
                </label>
                <input
                  type="text"
                  value={customer.customer_dob || ""}
                  onChange={(e) => handleManualDateChange(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 ml-3  block text-base font-normal font-openSans tracking-wide text-texto1">
                Email
              </label>
              <input
                type="email"
                name="customer_email"
                value={customer.customer_email || ""}
                onChange={handleChange}
                placeholder="e-mail.paciente@gmail.com"
                className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 ml-3 block text-base font-normal font-openSans tracking-wide text-texto1">
                  Telefone
                </label>
                <input
                  type="text"
                  name="customer_phone"
                  value={formatPhone(customer.customer_phone)}
                  inputMode="tel"
                  onChange={handleChange}
                  placeholder="(00) 0 0000-0000"
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 ml-3 block text-base font-normal font-openSans tracking-wide text-texto1">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="customer_cpf_cnpj"
                  value={formatDocument(customer.customer_cpf_cnpj)}
                  inputMode="numeric"
                  onChange={handleChange}
                  placeholder="CPF ou CNPJ"
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 ml-3 block text-base font-normal font-openSans tracking-wide text-texto1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="consultation_fee"
                  inputMode="decimal"
                  value={customer.consultation_fee || ""}
                  onChange={handleChange}
                  placeholder="R$ 000,00"
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-calendar"
                  className="mb-1 ml-3 block text-base font-normal font-openSans tracking-wide text-texto1"
                >
                  Calendário
                </label>
                <select
                  id="customer-calendar"
                  name="calendar_id"
                  value={customer.calendar_id || ""}
                  onChange={handleChange}
                  required
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-3 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring"
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {calendarOptions.map((cal) => (
                    <option key={cal.calendar_id} value={cal.calendar_id}>
                      {cal.calendar_name}
                      {cal.enabled ? "" : " (desabilitado)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {calendars.length > 0 && enabledCount === 0 && (
              <p className="ml-3 text-sm text-erro">
                Nenhum calendário habilitado. Habilite um no seu Perfil.
              </p>
            )}
            {isEditing &&
              selectedPatient?.calendar_id &&
              customer.calendar_id !== selectedPatient.calendar_id && (
                <p className="ml-3 text-sm text-texto3">
                  As consultas do calendário anterior deixarão de contar para
                  este paciente.
                </p>
              )}
          </div>
        </div>

        <div>
          {receiptHeader}
          <div className="mt-4 space-y-4 md:mt-0">
            <div>
              <label className="mb-1 ml-3 block text-base font-normal font-openSans tracking-wide text-texto1">
                Nome
              </label>
              <input
                type="text"
                name="alternative_name"
                value={customer.alternative_name || ""}
                onChange={handleChange}
                placeholder="Nome do Paciente"
                className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                disabled={customer.patient_status}
              />
            </div>

            <div className="relative">
              <label className="mb-1 ml-3 block text-base font-normal font-openSans tracking-wide text-texto1">
                CPF/CNPJ
              </label>
              <div className="flex sm:w-1/2">
                <input
                  type="text"
                  name="alternative_cpf_cnpj"
                  value={formatDocument(customer.alternative_cpf_cnpj)}
                  inputMode="numeric"
                  onChange={handleChange}
                  placeholder="CPF ou CNPJ"
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                />

              </div>
            </div>

            {additionalAlternatives.map((alternative, index) => (
              <div key={index}>
                <label className="mb-1.5 mt-1.5 ml-3 flex font-normal font-openSans tracking-wide text-texto1">
                  Nome Alternativo {index + 1}
                </label>
                <input
                  type="text"
                  name="alternative_name"
                  value={alternative.alternative_name || ""}
                  onChange={(e) =>
                    handleAlternativeChange(
                      index,
                      "alternative_name",
                      e.target.value
                    )
                  }
                  placeholder={`Nome Alternativo ${index + 1}`}
                  className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                  disabled={customer.patient_status}
                />

                <label className="mb-1.5 mt-4 ml-3 flex font-normal font-openSans tracking-wide text-texto1">
                  CPF Alternativo {index + 1}
                </label>
                <div className="flex items-center gap-2 sm:w-1/2">
                  <input
                    type="text"
                    name="alternative_cpf_cnpj"
                    value={formatDocument(alternative.alternative_cpf_cnpj)}
                    inputMode="numeric"
                    onChange={(e) =>
                      handleAlternativeChange(
                        index,
                        "alternative_cpf_cnpj",
                        onlyDigits(e.target.value).slice(0, 14)
                      )
                    }
                    placeholder={`CPF/CNPJ Alternativo ${index + 1}`}
                    className="h-[50px] w-full bg-bg1 rounded-xl border border-cinza6 px-4 py-2 text-texto2 shadow-sm focus:border-cinza6/50 focus:outline-none focus:ring disabled:opacity-60"
                    disabled={customer.patient_status}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteAlternativeCPF(index)}
                    className="shrink-0 rounded-full p-2 hover:bg-clara3"
                  >
                    <Trash />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {additionalAlternatives.length < 1 && (
            <button
              type="button"
              className="group h-4 justify-center items-start gap-2 mt-5 inline-flex text-primaria hover:text-primaria/50 bg-bg1 hover:bg-bg1 text-sm font-medium font-ubuntu tracking-tight"
              onClick={handleAddAlternativeFields}
            >
              <AddIcon />
              Adicionar item
            </button>
          )}
          <div className="mt-10 flex justify-end gap-4 md:mt-[130px]">
            <button
              type="button"
              className="h-[39px] rounded-[100px] border border-primaria bg-bg1 px-6 text-sm font-semibold text-primaria hover:bg-clara4"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="h-[39px] rounded-[100px] bg-primaria px-6 text-sm font-semibold text-white hover:opacity-90"
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateCustomerForm;
