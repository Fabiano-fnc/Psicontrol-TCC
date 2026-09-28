import React, { useMemo, useState } from "react";
import { closeOnBackdrop, useEscapeKey } from "../../../utils/Modal/useDismiss";
import { notify } from "../../../utils/notification/notify";

const REPEAT_OPTIONS = [
  { id: "none", label: "Só uma vez", step: 0 },
  { id: "weekly", label: "Toda semana", step: 7 },
  { id: "biweekly", label: "A cada 2 semanas", step: 14 },
];
const DURATIONS = [30, 40, 45, 50, 60, 90];
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const pad = (n) => String(n).padStart(2, "0");
const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// Datas das consultas (mesma conta que o backend faz)
const buildDates = (date, step, count) => {
  if (!date) return [];
  const [year, month, day] = date.split("-").map(Number);
  return Array.from({ length: step ? count : 1 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1, day + i * step));
    return `${WEEKDAYS[d.getUTCDay()]} ${pad(d.getUTCDate())}/${pad(
      d.getUTCMonth() + 1
    )}`;
  });
};

const buildIsoDates = (date, step, count) => {
  if (!date) return [];
  const [year, month, day] = date.split("-").map(Number);
  return Array.from({ length: step ? count : 1 }, (_, i) =>
    new Date(Date.UTC(year, month - 1, day + i * step)).toISOString().slice(0, 10)
  );
};

const HOURS = Array.from({ length: 17 }, (_, i) => pad(i + 6)); // 06h–22h
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Calendário do mês com dias grandes (o seletor nativo fica minúsculo no celular).
// highlighted: datas da série (a primeira é a selecionada)
const InlineCalendar = ({ value, onChange, highlighted = [] }) => {
  const today = todayIso();
  const [view, setView] = useState(() => {
    const [y, m] = (value || today).split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isCurrentMonth =
    `${view.year}-${pad(view.month + 1)}` === today.slice(0, 7);

  const move = (delta) =>
    setView(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });

  return (
    <div className="rounded-xl border border-cinza9 p-2">
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={isCurrentMonth}
          aria-label="Mês anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full text-texto3 hover:bg-clara4 hover:text-primaria disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-ubuntu text-base font-bold text-texto1">
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Próximo mês"
          className="flex h-10 w-10 items-center justify-center rounded-full text-texto3 hover:bg-clara4 hover:text-primaria"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i} className="py-1 text-[11px] font-semibold text-texto3">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />;
          const iso = `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
          const past = iso < today;
          const selected = iso === value;
          const inSeries = !selected && highlighted.includes(iso);
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              aria-label={`${day} de ${MONTHS[view.month]}`}
              className={`relative h-11 rounded-xl text-base font-semibold transition disabled:text-cinza6 ${
                selected
                  ? "bg-gradient-to-br from-primaria to-primariaEscura text-white shadow-card"
                  : inSeries
                    ? "bg-clara3 text-primaria"
                    : iso === today
                      ? "text-primaria ring-1 ring-inset ring-primaria/40 hover:bg-clara4"
                      : "text-texto1 hover:bg-clara4"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const fieldClass =
  "h-11 w-full rounded-xl border border-cinza6 bg-bg1 px-3 text-sm text-texto1 transition focus:border-primaria/60 focus:outline-none focus:ring-4 focus:ring-clara3";
const labelClass = "mb-1 ml-1 block text-sm font-semibold text-texto2";

// Agenda as consultas do paciente no Google Agenda (na agenda dele)
const ScheduleConsultations = ({ customer, justCreated = false, onClose, onScheduled }) => {
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("00");
  const time = hour ? `${hour}:${minute}` : "";
  const [duration, setDuration] = useState(50);
  const [repeat, setRepeat] = useState("weekly");
  const [occurrences, setOccurrences] = useState(4);
  const [saving, setSaving] = useState(false);

  useEscapeKey(!saving, onClose);

  const step = REPEAT_OPTIONS.find((o) => o.id === repeat).step;
  const count = Math.min(Math.max(Number(occurrences) || 1, 1), 26);
  const dates = useMemo(() => buildDates(date, step, count), [date, step, count]);
  const seriesIsoDates = useMemo(
    () => buildIsoDates(date, step, count),
    [date, step, count]
  );
  const canSubmit = date && time && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/customers/${customer.customer_id}/schedule`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
        body: JSON.stringify({
          date,
          start_time: time,
          duration_minutes: Number(duration),
          repeat,
          occurrences: count,
        }),
      }
    ).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) || {};
    setSaving(false);

    if (response?.ok) {
      notify.success(
        `${data.created.length} ${
          data.created.length === 1 ? "consulta agendada" : "consultas agendadas"
        } no Google Agenda.`
      );
      onScheduled?.();
      onClose();
      return;
    }
    notify.error(data.error || "Não foi possível agendar as consultas.");
    if (data.created?.length) onScheduled?.();
  };

  return (
    <div
      onClick={closeOnBackdrop(saving ? () => {} : onClose)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-texto1/30 p-4 backdrop-blur-[4px]"
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-title"
        className="flex max-h-[90vh] w-full max-w-[460px] animate-toast-in flex-col overflow-hidden rounded-2xl border border-cinza9 bg-bg1 shadow-dropShadow"
      >
        <div className="border-b border-cinza9 p-5 pb-4">
          {justCreated && (
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-sucesso/10 px-2.5 py-1 text-xs font-semibold text-sucesso">
              ✓ Paciente cadastrado
            </p>
          )}
          <h2
            id="schedule-title"
            className="font-ubuntu text-lg font-bold tracking-tight text-texto1"
          >
            Agendar consultas
          </h2>
          <p className="text-sm text-texto3">
            As consultas de <strong className="text-texto1">{customer.customer_name}</strong>{" "}
            vão para o Google Agenda, já vinculadas.
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div>
            <span className={labelClass}>Primeira consulta</span>
            <InlineCalendar
              value={date}
              onChange={setDate}
              highlighted={seriesIsoDates}
            />
          </div>

          <div>
            <span className={labelClass}>Horário</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <select
                aria-label="Hora"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className={`${fieldClass} h-12 text-base`}
              >
                <option value="">Hora</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
              <span className="text-lg font-bold text-texto3">:</span>
              <select
                aria-label="Minutos"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className={`${fieldClass} h-12 text-base`}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="schedule-duration" className={labelClass}>
              Duração
            </label>
            <select
              id="schedule-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={fieldClass}
            >
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutos
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={labelClass}>Repetir</span>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-clara4 p-1">
              {REPEAT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRepeat(option.id)}
                  aria-pressed={repeat === option.id}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    repeat === option.id
                      ? "bg-bg1 text-primaria shadow-card"
                      : "text-texto3 hover:text-primaria"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {step > 0 && (
            <div className="flex items-center gap-3">
              <label htmlFor="schedule-count" className="text-sm font-semibold text-texto2">
                Quantas consultas
              </label>
              <input
                id="schedule-count"
                type="number"
                min={1}
                max={26}
                value={occurrences}
                onChange={(e) => setOccurrences(e.target.value)}
                className={`${fieldClass} w-20`}
              />
            </div>
          )}

          {dates.length > 0 && (
            <div className="rounded-xl bg-clara4 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-texto3">
                {dates.length === 1 ? "Consulta" : `${dates.length} consultas`}
                {time && ` às ${time}`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dates.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-bg1 px-2.5 py-1 text-xs font-semibold text-texto1 shadow-card"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-cinza9 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-full border border-cinza9 bg-bg1 px-5 text-sm font-semibold text-texto2 transition hover:bg-clara4 disabled:opacity-50"
          >
            {justCreated ? "Agora não" : "Cancelar"}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-10 rounded-full bg-primaria px-5 text-sm font-semibold text-white shadow-card transition hover:opacity-90 disabled:opacity-50"
          >
            {saving
              ? "Agendando..."
              : `Agendar ${dates.length > 1 ? `${dates.length} consultas` : "consulta"}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleConsultations;
