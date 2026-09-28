import { useEscapeKey } from "../../utils/Modal/useDismiss";
import ConfirmDialog from "../../utils/Modal/ConfirmDialog";
import React, { useState, useEffect, useRef } from "react";
import { Months } from "../../utils/Months/months";
import { fetchSavedCalendars } from "../../service/pagesService/pagesService";
import { notify } from "../../utils/notification/notify";
import { formatBRL } from "../../utils/format/format";
import {
  showSaveToast,
  showDeleteToast,
  showLastMonthToast,
  showRepeatSuccessToast,
} from "./components/toastIncomePage";

// Campo de valor: guarda só os dígitos digitados e mostra como moeda
const formatCurrencyInput = (digits) => {
  const numeric = (digits || "").replace(/\D/g, "");
  if (!numeric) return "";
  return (parseInt(numeric, 10) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const digitsToValue = (digits) =>
  (parseInt((digits || "").replace(/\D/g, ""), 10) || 0) / 100;

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

const icons = {
  revenue: "M12 19V5M5 12l7-7 7 7",
  expense: "M12 5v14M19 12l-7 7-7-7",
  balance:
    "M3.5 7.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Zm0 0V6a2 2 0 0 1 2-2h10.5M16.5 13.5h.01",
  repeat: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
  plus: "M12 5v14M5 12h14",
  trash:
    "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  check: "m5 12.5 4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6 6 18",
};

const SECTIONS = {
  revenue: {
    title: "Receitas",
    subtitle: "Entradas além das consultas",
    singular: "receita",
    namePlaceholder: "Ex.: Supervisão, palestra",
    icon: icons.revenue,
    iconClass: "bg-green-50 text-sucesso",
  },
  expense: {
    title: "Despesas",
    subtitle: "Aluguel, materiais, impostos…",
    singular: "despesa",
    namePlaceholder: "Ex.: Aluguel da sala",
    icon: icons.expense,
    iconClass: "bg-red-50 text-erro",
  },
};

const fieldClass =
  "h-11 w-full min-w-0 rounded-xl border border-cinza6 bg-bg1 px-3 text-base text-texto1 transition placeholder:text-texto3/70 focus:border-primaria/60 focus:outline-none focus:ring-4 focus:ring-clara3 sm:text-sm";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
  "Content-Type": "application/json",
});

let draftSeq = 0;
const newDraft = () => ({ key: ++draftSeq, name: "", value: "", calendar_id: "" });

// Linha de um lançamento novo: Enter no nome vai para o valor; Enter no valor salva
const DraftRow = ({ type, draft, calendars, onChange, onSave, onRemove }) => {
  const valueRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const canSave = draft.name.trim() && digitsToValue(draft.value) > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const ok = await onSave(draft);
    if (!ok) setSaving(false);
  };

  return (
    <li className="animate-toast-in rounded-2xl border border-dashed border-primaria/40 bg-clara4 p-3">
      <div className="grid grid-cols-[1fr_120px] gap-2 sm:grid-cols-[1fr_130px]">
        <input
          type="text"
          autoFocus
          aria-label={`Nome da ${SECTIONS[type].singular}`}
          placeholder={SECTIONS[type].namePlaceholder}
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && valueRef.current?.focus()}
          className={fieldClass}
        />
        <input
          ref={valueRef}
          type="text"
          inputMode="numeric"
          aria-label="Valor"
          placeholder="R$ 0,00"
          value={formatCurrencyInput(draft.value)}
          onChange={(e) =>
            onChange({ ...draft, value: e.target.value.replace(/\D/g, "") })
          }
          onKeyDown={(e) => e.key === "Enter" && save()}
          className={`${fieldClass} text-right`}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {calendars.length > 0 ? (
          <select
            aria-label="Agenda"
            value={draft.calendar_id}
            onChange={(e) => onChange({ ...draft, calendar_id: e.target.value })}
            className={`${fieldClass} basis-full sm:basis-auto sm:flex-1`}
          >
            <option value="">Geral (todas as agendas)</option>
            {calendars.map((cal) => (
              <option key={cal.calendar_id} value={cal.calendar_id}>
                {cal.calendar_name}
              </option>
            ))}
          </select>
        ) : (
          <span className="hidden flex-1 sm:block" />
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Descartar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cinza6 bg-bg1 text-texto3 transition hover:border-erro/40 hover:text-erro"
        >
          <Icon d={icons.close} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primaria px-4 sm:flex-none text-sm font-semibold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-cinza6 disabled:shadow-none"
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Icon d={icons.check} className="h-4 w-4" />
          )}
          Salvar
        </button>
      </div>
    </li>
  );
};

const EntriesCard = ({
  type,
  entries,
  drafts,
  calendars,
  enabledCalendars,
  calendarLabel,
  onAddDraft,
  onChangeDraft,
  onSaveDraft,
  onRemoveDraft,
  onDelete,
  loading,
}) => {
  const section = SECTIONS[type];
  const total = entries.reduce((acc, e) => acc + parseFloat(e.value || 0), 0);

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-cinza9 bg-bg1 p-4 shadow-card md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.iconClass}`}
          >
            <Icon d={section.icon} />
          </span>
          <div className="min-w-0">
            <h2 className="font-ubuntu text-lg font-bold tracking-tight text-texto1">
              {section.title}
            </h2>
            <p className="truncate text-sm text-texto3">{section.subtitle}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-ubuntu text-lg font-bold text-texto1">
            {formatBRL(total)}
          </p>
          <p className="text-xs text-texto3">
            {entries.length}{" "}
            {entries.length === 1 ? "lançamento" : "lançamentos"}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {loading ? (
          [0, 1].map((i) => (
            <li key={i} className="h-[58px] animate-pulse rounded-2xl bg-clara4" />
          ))
        ) : entries.length === 0 && drafts.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-cinza6 px-4 py-6 text-center text-sm text-texto3">
            Nenhuma {section.singular} neste mês.
          </li>
        ) : (
          entries.map((entry) => (
            <li
              key={entry.id}
              className="group flex items-center gap-3 rounded-2xl border border-cinza9 bg-bg1 px-3 py-2.5 transition hover:border-cinza6"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-texto1">
                  {entry.name}
                </p>
                {calendars.length > 0 && (
                  <span className="mt-0.5 inline-block max-w-full truncate rounded-full bg-clara3 px-2 py-0.5 text-[11px] font-semibold text-primaria">
                    {calendarLabel(entry.calendar_id)}
                  </span>
                )}
              </div>
              <p className="shrink-0 font-semibold tabular-nums text-texto1">
                {formatBRL(entry.value)}
              </p>
              <button
                type="button"
                onClick={() => onDelete(entry, type)}
                aria-label={`Excluir ${section.singular} ${entry.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-texto3 transition hover:bg-erro/10 hover:text-erro focus:outline-none focus-visible:ring-4 focus-visible:ring-erro/20"
              >
                <Icon d={icons.trash} className="h-[18px] w-[18px]" />
              </button>
            </li>
          ))
        )}

        {drafts.map((draft) => (
          <DraftRow
            key={draft.key}
            type={type}
            draft={draft}
            calendars={enabledCalendars}
            onChange={(next) => onChangeDraft(type, next)}
            onSave={(d) => onSaveDraft(type, d)}
            onRemove={() => onRemoveDraft(type, draft.key)}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onAddDraft(type)}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cinza6 text-sm font-semibold text-primaria transition hover:border-primaria/50 hover:bg-clara4 focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3"
      >
        <Icon d={icons.plus} className="h-4 w-4" />
        Adicionar {section.singular}
      </button>
    </section>
  );
};

const IncomePage = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [entries, setEntries] = useState({ revenue: [], expense: [] });
  const [drafts, setDrafts] = useState({ revenue: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [repeating, setRepeating] = useState(false);

  useEffect(() => {
    fetchSavedCalendars()
      .then(setCalendars)
      .catch(() => setCalendars([]));
  }, []);

  useEffect(() => {
    let active = true;
    const monthYear = `${selectedMonth}/${selectedYear.slice(-2)}`;
    const load = async (type) => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/income/${type}?monthYear=${monthYear}`,
        { headers: authHeaders() }
      ).catch(() => null);
      return response?.ok ? response.json() : [];
    };

    setLoading(true);
    setDrafts({ revenue: [], expense: [] });
    Promise.all([load("revenue"), load("expense")]).then(([revenue, expense]) => {
      if (!active) return;
      setEntries({ revenue, expense });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  const enabledCalendars = calendars.filter((cal) => cal.enabled);

  // Lançamento sem agenda = "Geral"
  const calendarLabel = (calendarId) => {
    if (!calendarId) return "Geral";
    const cal = calendars.find((c) => c.calendar_id === calendarId);
    return cal ? cal.calendar_name : "Agenda removida";
  };

  const handlePeriodChange = (month, year) => {
    setSelectedMonth(String(month).padStart(2, "0"));
    setSelectedYear(String(year));
  };

  const addDraft = (type) =>
    setDrafts((prev) => ({ ...prev, [type]: [...prev[type], newDraft()] }));

  const changeDraft = (type, next) =>
    setDrafts((prev) => ({
      ...prev,
      [type]: prev[type].map((d) => (d.key === next.key ? next : d)),
    }));

  const removeDraft = (type, key) =>
    setDrafts((prev) => ({
      ...prev,
      [type]: prev[type].filter((d) => d.key !== key),
    }));

  const saveDraft = async (type, draft) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/income/${type}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: draft.name.trim(),
        value: digitsToValue(draft.value),
        date: `01/${selectedMonth}/${selectedYear}`,
        calendar_id: draft.calendar_id || null,
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));

    if (!response?.ok) {
      notify.error(
        data?.error || `Não foi possível salvar a ${SECTIONS[type].singular}.`
      );
      return false;
    }
    setEntries((prev) => ({ ...prev, [type]: [...prev[type], data] }));
    removeDraft(type, draft.key);
    showSaveToast();
    return true;
  };

  const repeatLastMonthEntries = async () => {
    setRepeating(true);
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/income/entries/repeat-last-month`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ selectedMonth, selectedYear }),
      }
    ).catch(() => null);
    setRepeating(false);

    if (response?.ok) {
      const result = await response.json();
      setEntries((prev) => ({
        revenue: [...prev.revenue, ...result.newRevenues],
        expense: [...prev.expense, ...result.newExpenses],
      }));
      showRepeatSuccessToast();
    } else if (response?.status === 400) {
      showLastMonthToast();
    } else {
      notify.error("Não foi possível copiar os lançamentos do mês anterior.");
    }
  };

  const closeDeleteModal = () => setToDelete(null);
  useEscapeKey(toDelete !== null, closeDeleteModal);

  const confirmDelete = async () => {
    const { entry, type } = toDelete;
    closeDeleteModal();
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/income/${type}/${entry.id}`,
      { method: "DELETE", headers: authHeaders() }
    ).catch(() => null);
    if (response?.ok) {
      setEntries((prev) => ({
        ...prev,
        [type]: prev[type].filter((e) => e.id !== entry.id),
      }));
      showDeleteToast();
    } else {
      notify.error(`Não foi possível excluir a ${SECTIONS[type].singular}.`);
    }
  };

  const sum = (list) => list.reduce((acc, e) => acc + parseFloat(e.value || 0), 0);
  const totalRevenue = sum(entries.revenue);
  const totalExpense = sum(entries.expense);
  const balance = totalRevenue - totalExpense;

  const cardProps = {
    calendars,
    enabledCalendars,
    calendarLabel,
    onAddDraft: addDraft,
    onChangeDraft: changeDraft,
    onSaveDraft: saveDraft,
    onRemoveDraft: removeDraft,
    onDelete: (entry, type) => setToDelete({ entry, type }),
    loading,
  };

  const SummaryTile = ({ label, value, icon, iconClass, destaque = false }) => (
    <div
      className={`relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 shadow-card ${
        destaque
          ? "bg-gradient-to-br from-primaria to-primariaEscura text-white"
          : "border border-cinza9 bg-bg1 text-texto1"
      }`}
    >
      {destaque && (
        <span className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-destaque/40 blur-2xl" />
      )}
      <span
        className={`relative hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${
          destaque ? "bg-white/15 text-white" : iconClass
        }`}
      >
        <Icon d={icon} />
      </span>
      <div className="relative min-w-0">
        <p
          className={`truncate text-xs font-semibold uppercase tracking-wide ${
            destaque ? "text-white/75" : "text-texto3"
          }`}
        >
          {label}
        </p>
        <p className="mt-0.5 truncate font-ubuntu text-lg font-bold md:text-xl">
          {loading ? "…" : value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 pb-8 pt-24 md:px-6 md:pt-28">
      <div className="mx-auto flex w-full max-w-[1076px] flex-col gap-4">
        {/* Período + ação */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
          <Months
            onPeriodChange={handlePeriodChange}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            wrapperClassName="z-20 w-full sm:w-[230px]"
          />
          <button
            type="button"
            onClick={repeatLastMonthEntries}
            disabled={repeating || loading}
            className="group inline-flex h-11 items-center justify-center gap-2 self-center rounded-full border border-cinza9 bg-bg1 pl-1.5 pr-4 text-sm font-semibold text-texto2 shadow-card transition hover:border-primaria/40 hover:text-primaria focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 disabled:cursor-wait disabled:opacity-70 max-sm:w-full"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clara3 text-primaria transition group-hover:bg-primaria group-hover:text-white">
              {repeating ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primaria/30 border-t-primaria" />
              ) : (
                <Icon d={icons.repeat} className="h-4 w-4" />
              )}
            </span>
            Repetir lançamentos do mês anterior
          </button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <SummaryTile
            label="Receitas"
            value={formatBRL(totalRevenue)}
            icon={icons.revenue}
            iconClass="bg-green-50 text-sucesso"
          />
          <SummaryTile
            label="Despesas"
            value={formatBRL(totalExpense)}
            icon={icons.expense}
            iconClass="bg-red-50 text-erro"
          />
          <div className="col-span-2 md:col-span-1">
            <SummaryTile
              label="Saldo dos lançamentos"
              value={formatBRL(balance)}
              icon={icons.balance}
              destaque
            />
          </div>
        </div>

        {/* Listas */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EntriesCard
            type="revenue"
            entries={entries.revenue}
            drafts={drafts.revenue}
            {...cardProps}
          />
          <EntriesCard
            type="expense"
            entries={entries.expense}
            drafts={drafts.expense}
            {...cardProps}
          />
        </div>

        <p className="text-center text-xs text-texto3">
          Aparecem os lançamentos “Geral” e os das agendas ativas. As consultas
          entram sozinhas no dashboard.
        </p>
      </div>

      {toDelete && (
        <ConfirmDialog
          tone="danger"
          title={
            toDelete.type === "revenue" ? "Excluir receita?" : "Excluir despesa?"
          }
          confirmLabel="Excluir"
          onCancel={closeDeleteModal}
          onConfirm={confirmDelete}
        >
          <strong className="text-texto1">
            {toDelete.entry.name} · {formatBRL(toDelete.entry.value)}
          </strong>{" "}
          será removida deste mês.
        </ConfirmDialog>
      )}
    </div>
  );
};

export default IncomePage;
