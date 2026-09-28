import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PsiText from "../LoginPage/images/PsiText.png";
import { notify } from "../../utils/notification/notify";
import "../../index.css";

const Icone = ({ children, className = "h-5 w-5" }) => (
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
    {children}
  </svg>
);

const calendarPath =
  "M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z";

const etapas = [
  { titulo: "Conta Google conectada", texto: "Login feito com sucesso." },
  {
    titulo: "Escolha as agendas",
    texto: "Marque as agendas onde ficam as consultas.",
  },
  {
    titulo: "Pronto",
    texto: "As consultas entram no dashboard automaticamente.",
  },
];

// A agenda principal do Google tem o próprio e-mail da conta como ID
const isPrimary = (calendar) =>
  calendar.calendar_id?.includes("@") &&
  !calendar.calendar_id.endsWith("calendar.google.com");

const SelectCalendarPage = () => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(new Set());
  const [savingIds, setSavingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchCalendars = async () => {
    const authenticationToken = localStorage.getItem("authentication_token");

    if (!authenticationToken) {
      setError("Sua sessão não foi encontrada.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/events/calendars`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authenticationToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Agendas que sumiram do Google são tratadas em Minhas Configurações
        const available = data.filter((calendar) => !calendar.missing);
        setCalendars(available);

        const activeCalendars = new Set(
          available
            .filter((calendar) => calendar.enabled)
            .map((calendar) => calendar.calendar_id)
        );
        setSelectedCalendarIds(activeCalendars);

        setLoading(false);
      } else {
        setLoading(false);
        setError("Não foi possível acessar o Google Agenda.");
      }
    } catch (error) {
      setLoading(false);
      setError("Erro ao conectar com o servidor.");
    }
  };

  useEffect(() => {
    document.title = "Escolher agenda · Psicontrol";
    fetchCalendars();
  }, []);

  const updateSet = (setter, id, add) =>
    setter((prev) => {
      const next = new Set(prev);
      if (add) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleToggle = async (calendar) => {
    const id = calendar.calendar_id;
    if (savingIds.has(id)) return;
    const isSelected = selectedCalendarIds.has(id);

    // Marca na hora e desfaz se o servidor não salvar
    updateSet(setSelectedCalendarIds, id, !isSelected);
    updateSet(setSavingIds, id, true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/events/calendars/selection/${encodeURIComponent(id)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: !isSelected,
            calendar_name: calendar.calendar_name,
          }),
        }
      );
      if (!response.ok) throw new Error();
    } catch {
      updateSet(setSelectedCalendarIds, id, isSelected);
      notify.error(
        `Não foi possível ${isSelected ? "desmarcar" : "marcar"} a agenda “${calendar.calendar_name}”.`
      );
    } finally {
      updateSet(setSavingIds, id, false);
    }
  };

  const handleProceed = () => {
    const ids = Array.from(selectedCalendarIds);

    localStorage.setItem("selectedCalendars", JSON.stringify(ids));
    navigate(`/create-event-form?calendarIds=${ids.join(",")}`);
  };

  const selectedCount = selectedCalendarIds.size;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-clara4 lg:flex-row">
      {/* Painel da marca, igual ao do login */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primaria via-primariaEscura to-[#003B63] shrink-0 px-6 pb-20 pt-6 text-white lg:flex lg:h-full lg:w-[45%] lg:flex-col lg:px-14 lg:pb-12 lg:pt-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-destaque/40 blur-3xl motion-safe:animate-blob" />
        <div
          className="pointer-events-none absolute -bottom-32 right-[-60px] h-96 w-96 rounded-full bg-sky-300/25 blur-3xl motion-safe:animate-blob"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex h-full flex-col">
          <img src={PsiText} alt="Psicontrol" className="h-auto w-[137px]" />

          <div className="mt-5 max-w-[520px] motion-safe:animate-fade-up lg:mt-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Quase lá
            </span>
            <h1 className="mt-3 font-ubuntu text-[24px] font-bold leading-tight lg:mt-4 lg:text-[36px]">
              Quais agendas são
              <br />
              <span className="bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent">
                do seu consultório?
              </span>
            </h1>
            <p className="mt-2 text-[14px] text-white/80 lg:mt-3 lg:text-[16px]">
              Só os eventos das agendas marcadas viram consultas no sistema.
            </p>
          </div>

          <ol className="mt-10 hidden max-w-[440px] lg:block">
            {etapas.map((etapa, i) => {
              const done = i === 0;
              const current = i === 1;
              return (
                <li
                  key={etapa.titulo}
                  className="relative flex gap-3 pb-7 last:pb-0 motion-safe:animate-fade-up"
                  style={{ animationDelay: `${0.15 * (i + 1)}s` }}
                >
                  {i < etapas.length - 1 && (
                    <span className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-white/25" />
                  )}
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-ubuntu font-bold ${
                      done
                        ? "bg-emerald-400/90 text-emerald-950"
                        : current
                        ? "bg-white text-primaria"
                        : "bg-white/15 text-white/80"
                    }`}
                  >
                    {done ? (
                      <Icone className="h-5 w-5">
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </Icone>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="pt-0.5">
                    <p className={`font-semibold ${current ? "" : "text-white/85"}`}>
                      {etapa.titulo}
                    </p>
                    <p className="text-sm text-white/70">{etapa.texto}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Escolha das agendas */}
      <section className="relative z-10 -mt-14 flex min-h-0 flex-1 items-start justify-center px-4 pb-4 lg:mt-0 lg:items-center lg:px-10 lg:py-10">
        <div
          className="flex max-h-full w-full max-w-[460px] flex-col motion-safe:animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex min-h-0 flex-col rounded-3xl bg-white p-5 shadow-card ring-1 ring-cinza9 lg:p-8">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clara3 text-primaria lg:flex">
              <Icone className="h-6 w-6">
                <path d={calendarPath} />
              </Icone>
            </span>
            <h2 className="font-ubuntu text-[22px] font-bold text-texto1 lg:mt-5 lg:text-[24px]">
              Minhas agendas
            </h2>
            <p className="mt-1 text-[15px] text-texto3">
              Marque uma ou mais agendas do Google para acompanhar.
            </p>

            {loading ? (
              <ul className="mt-5 space-y-2.5 lg:mt-6" aria-label="Carregando agendas">
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="h-[60px] animate-pulse rounded-2xl bg-clara4"
                  />
                ))}
              </ul>
            ) : error ? (
              <div className="mt-6">
                <p className="flex items-start gap-2 rounded-xl border border-erro/30 bg-red-50 px-3 py-2.5 text-sm text-red-900">
                  <Icone className="mt-0.5 h-4 w-4 shrink-0">
                    <path d="M12 8v5M12 16.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
                  </Icone>
                  {error} Faça login novamente para continuar.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-5 w-full rounded-xl border border-cinza6 bg-white px-4 py-3 font-semibold text-texto2 shadow-sm transition hover:border-primaria hover:text-primaria focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2"
                >
                  Entrar novamente
                </button>
              </div>
            ) : (
              <>
                {calendars.length === 0 ? (
                  <p className="mt-6 rounded-2xl bg-clara4 px-4 py-5 text-center text-sm text-texto3">
                    Nenhuma agenda encontrada nesta conta Google. Crie uma no
                    Google Agenda e entre novamente.
                  </p>
                ) : (
                  <ul className="-mx-1 mt-4 min-h-0 space-y-2.5 overflow-y-auto overscroll-contain p-1 lg:mt-5">
                    {calendars.map((calendar) => {
                      const checked = selectedCalendarIds.has(calendar.calendar_id);
                      const saving = savingIds.has(calendar.calendar_id);
                      return (
                        <li key={calendar.calendar_id}>
                          <label
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-primaria focus-within:ring-offset-2 ${
                              checked
                                ? "border-primaria bg-clara4"
                                : "border-cinza9 bg-white hover:border-cinza6 hover:bg-clara4/60"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => handleToggle(calendar)}
                            />
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                checked ? "bg-primaria text-white" : "bg-clara3 text-primaria"
                              }`}
                            >
                              <Icone className="h-5 w-5">
                                <path d={calendarPath} />
                              </Icone>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-texto1 [overflow-wrap:anywhere]">
                                {calendar.calendar_name}
                              </span>
                              <span className="block text-xs text-texto3">
                                {saving
                                  ? "Salvando..."
                                  : `${isPrimary(calendar) ? "Agenda principal · " : ""}${
                                      checked ? "Sincronizando consultas" : "Não sincronizada"
                                    }`}
                              </span>
                            </span>
                            <span
                              aria-hidden="true"
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                                checked
                                  ? "border-primaria bg-primaria text-white"
                                  : "border-cinza6 bg-white text-transparent"
                              }`}
                            >
                              {saving ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              ) : (
                                <Icone className="h-4 w-4">
                                  <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="2.6" />
                                </Icone>
                              )}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <button
                  onClick={handleProceed}
                  disabled={selectedCount === 0 || savingIds.size > 0}
                  className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primaria to-primariaEscura px-4 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-cinza6 disabled:to-cinza6 disabled:shadow-none"
                >
                  Continuar
                  <Icone className="h-5 w-5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </Icone>
                </button>
                <p className="mt-2.5 shrink-0 text-center text-xs text-texto3">
                  {selectedCount === 0
                    ? "Marque pelo menos uma agenda para continuar."
                    : `${selectedCount} ${
                        selectedCount === 1 ? "agenda selecionada" : "agendas selecionadas"
                      } · dá para mudar depois em Minhas Configurações`}
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SelectCalendarPage;
