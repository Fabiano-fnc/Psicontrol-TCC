import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { closeOnBackdrop, useEscapeKey } from "../../../utils/Modal/useDismiss";
import { fetchCustomers } from "../../../service/pagesService/pagesService";
import { formatPhone } from "../../../utils/format/format";

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

// Sem acentos e minúsculo, para comparar nomes
const normalize = (text = "") =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// O nome do evento contém o nome completo ou nome + sobrenome do paciente
const matchesEvent = (customerName, eventName) => {
  const event = normalize(eventName);
  const words = normalize(customerName).split(/\s+/).filter(Boolean);
  if (!event || words.length === 0) return false;
  if (event.includes(words.join(" "))) return true;
  return words.length > 1 && event.includes(`${words[0]} ${words[1]}`);
};

// Abre o cadastro na tela de Pacientes já preenchido (nome, agenda e,
// se houver, os dados de um cadastro existente em outra agenda)
const newCustomerState = (event, copyFrom) => ({
  newCustomer: {
    customer_name: copyFrom?.customer_name || event?.name || "",
    calendar_id: event?.calendar_id || "",
    copyFrom: copyFrom?.customer_id || null,
  },
});

const formatDate = (isoDate) => {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

// Escolha do paciente para vincular a um evento de "Pacientes não encontrados"
const LinkPatientModal = ({ event, paused = false, onSelect, onClose }) => {
  const [customers, setCustomers] = useState(null);
  const [search, setSearch] = useState("");

  // Com a confirmação aberta por cima, o Esc fecha só ela
  useEscapeKey(!paused, onClose);

  useEffect(() => {
    fetchCustomers()
      .then((data) => setCustomers(data.customers || []))
      .catch(() => setCustomers([]));
  }, []);

  const { suggested, notLinked, others, hiddenCount } = useMemo(() => {
    const list = customers || [];
    // Só pacientes sem agenda ou da mesma agenda do evento podem ser vinculados
    const compatible = list.filter(
      (c) =>
        !event?.calendar_id || !c.calendar_id || c.calendar_id === event.calendar_id
    );
    const term = normalize(search);
    const visible = compatible
      .filter((c) => !term || normalize(c.customer_name).includes(term))
      .sort((a, b) => a.customer_name.localeCompare(b.customer_name, "pt-BR"));

    const isSuggested = (c) => matchesEvent(c.customer_name, event?.name);
    return {
      suggested: visible.filter(isSuggested),
      notLinked: visible.filter((c) => !isSuggested(c) && !c.linked_events),
      others: visible.filter((c) => !isSuggested(c) && c.linked_events > 0),
      hiddenCount: list.length - compatible.length,
    };
  }, [customers, search, event]);

  const total = suggested.length + notLinked.length + others.length;

  const renderGroup = (title, items, badge) =>
    items.length > 0 && (
      <div className="mb-3">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-texto3">
          {title}
        </p>
        <ul>
          {items.map((customer) => (
            <li key={customer.customer_id}>
              <button
                type="button"
                onClick={() => onSelect(customer)}
                className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-clara4 focus:bg-clara4 focus:outline-none"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clara3 font-ubuntu text-sm font-bold text-primaria group-hover:bg-primaria group-hover:text-white">
                  {customer.customer_name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-texto1">
                    {customer.customer_name}
                  </span>
                  <span className="block truncate text-xs text-texto3">
                    {customer.linked_events
                      ? `${customer.linked_events} ${
                          customer.linked_events === 1
                            ? "consulta vinculada"
                            : "consultas vinculadas"
                        }`
                      : "Nenhuma consulta vinculada"}
                    {customer.customer_phone &&
                      ` · ${formatPhone(customer.customer_phone)}`}
                  </span>
                </span>
                {badge && (
                  <span className="shrink-0 rounded-full bg-clara3 px-2 py-0.5 text-[11px] font-semibold text-primaria">
                    {badge}
                  </span>
                )}
                <Icon
                  d="m9 18 6-6-6-6"
                  className="h-4 w-4 shrink-0 text-texto3 group-hover:text-primaria"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div
      onClick={closeOnBackdrop(onClose)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-texto1/30 p-4 backdrop-blur-[4px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-patient-title"
        className="flex max-h-[85vh] w-full max-w-[460px] animate-toast-in flex-col overflow-hidden rounded-2xl border border-cinza9 bg-bg1 shadow-dropShadow"
      >
        <div className="border-b border-cinza9 p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="link-patient-title"
                className="font-ubuntu text-lg font-bold tracking-tight text-texto1"
              >
                Vincular paciente
              </h2>
              <p className="text-sm text-texto3">
                Escolha quem é o paciente deste evento.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto3 hover:bg-clara4 hover:text-primaria"
            >
              <Icon d="M6 6l12 12M18 6 6 18" />
            </button>
          </div>

          {event && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-clara4 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg1 text-primaria shadow-card">
                <Icon d="M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-texto1">
                  {event.name}
                </span>
                {event.date && (
                  <span className="block text-xs text-texto3">
                    Evento de {formatDate(event.date)}
                  </span>
                )}
              </span>
            </div>
          )}

          {event?.duplicate_of && (
            <div className="mt-3 rounded-xl border border-aviso/40 bg-aviso/10 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-texto1">
                <Icon
                  d="M12 4 2.5 20h19L12 4ZM12 10v4M12 17h.01"
                  className="h-4 w-4 shrink-0 text-aviso"
                />
                Possível duplicado
              </p>
              <p className="mt-1 text-xs leading-relaxed text-texto2">
                <strong>{event.duplicate_of.customer_name}</strong> já tem
                consulta neste dia na agenda{" "}
                <strong>{event.duplicate_of.calendar_name}</strong>, e cada
                paciente pertence a uma agenda só. Se for a mesma consulta,
                feche e use “Excluir evento”. Se a pessoa também é atendida em{" "}
                <strong>{event.calendar_name || "nesta agenda"}</strong>,
                cadastre-a aqui: as consultas desta agenda são vinculadas na hora.
              </p>
              <Link
                to="/customers"
                state={newCustomerState(event, event.duplicate_of)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primaria px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <Icon d="M12 5v14M5 12h14" className="h-3.5 w-3.5" />
                Cadastrar em {event.calendar_name || "nesta agenda"}
              </Link>
            </div>
          )}

          <div className="relative mt-3">
            <Icon
              d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto3"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente"
              autoFocus
              className="h-11 w-full rounded-xl border border-cinza6 bg-bg1 pl-9 pr-3 text-sm text-texto1 transition focus:border-primaria/60 focus:outline-none focus:ring-4 focus:ring-clara3"
            />
          </div>
        </div>

        <div className="min-h-[160px] flex-1 overflow-y-auto p-3">
          {customers === null ? (
            <p className="py-8 text-center text-sm text-texto3">
              Carregando pacientes...
            </p>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-texto3">
                {search
                  ? `Nenhum paciente encontrado para “${search}”.`
                  : "Nenhum paciente cadastrado nesta agenda."}
              </p>
              <Link
                to="/customers"
                state={newCustomerState(event)}
                className="rounded-full bg-primaria px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Cadastrar paciente
              </Link>
            </div>
          ) : (
            <>
              {renderGroup("Sugestão", suggested, "Mesmo nome")}
              {renderGroup("Ainda sem consultas vinculadas", notLinked)}
              {renderGroup(
                suggested.length || notLinked.length
                  ? "Outros pacientes"
                  : "Pacientes",
                others
              )}
            </>
          )}
        </div>

        {hiddenCount > 0 && (
          <p className="border-t border-cinza9 px-5 py-3 text-xs text-texto3">
            {hiddenCount}{" "}
            {hiddenCount === 1
              ? "paciente de outra agenda não aparece"
              : "pacientes de outras agendas não aparecem"}{" "}
            aqui.
          </p>
        )}
      </div>
    </div>
  );
};

export default LinkPatientModal;
