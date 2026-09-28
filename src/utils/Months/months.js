import { useCallback, useRef, useState } from "react";
import { useOutsideClick } from "../OutsideClick/useOutsideClick";
import { useEscapeKey } from "../Modal/useDismiss";

const monthsInRange = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const monthsInRangeShort = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

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

const calendarPath =
  "M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z";

// onPeriodChange(mês, ano) troca os dois de uma vez; sem ele, cai em onYearChange/onMonthChange
export const Months = ({
  onMonthChange,
  onYearChange,
  onPeriodChange,
  selectedMonth,
  selectedYear,
  wrapperClassName = "flex-1 ml-3 top-3 md:z-30",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(Number(selectedYear));
  const wrapperRef = useRef(null);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const month = Number(selectedMonth);
  const year = Number(selectedYear);

  const close = useCallback(() => setIsOpen(false), []);
  useOutsideClick(wrapperRef, close);
  useEscapeKey(isOpen, close);

  const toggle = () => {
    if (!isOpen) setViewYear(year);
    setIsOpen(!isOpen);
  };

  const selectPeriod = (newMonth, newYear) => {
    if (onPeriodChange) {
      onPeriodChange(newMonth, newYear);
    } else {
      if (newYear !== year) onYearChange(newYear);
      onMonthChange(newMonth);
    }
    close();
  };

  const label = `${monthsInRange[month - 1]}/${String(year).slice(-2)}`;

  return (
    <div ref={wrapperRef} className={`relative ${wrapperClassName}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`group flex h-full w-full items-center gap-3 rounded-2xl border bg-bg1 px-3 py-2 text-left shadow-card transition hover:border-primaria/40 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 ${
          isOpen ? "border-primaria/60 ring-4 ring-clara3" : "border-cinza9"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primaria to-primariaEscura text-white md:h-10 md:w-10">
          <Icon d={calendarPath} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-texto3">
            Período
          </span>
          <span className="block truncate font-ubuntu text-base font-bold tracking-tight text-texto1">
            {label}
          </span>
        </span>
        <Icon
          d="m6 9 6 6 6-6"
          className={`h-5 w-5 shrink-0 text-texto3 transition-transform group-hover:text-primaria ${
            isOpen ? "rotate-180 text-primaria" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Selecionar período"
          className="absolute left-0 top-full z-50 mt-2 w-[272px] max-w-[calc(100vw-2rem)] animate-toast-in rounded-2xl border border-cinza9 bg-bg1 p-3 shadow-dropShadow"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-texto3 hover:bg-clara4 hover:text-primaria"
              aria-label="Ano anterior"
            >
              <Icon d="m15 18-6-6 6-6" className="h-4 w-4" />
            </button>
            <span className="font-ubuntu text-base font-bold tracking-tight text-texto1">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-texto3 hover:bg-clara4 hover:text-primaria"
              aria-label="Próximo ano"
            >
              <Icon d="m9 18 6-6-6-6" className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {monthsInRangeShort.map((name, index) => {
              const isSelected = index + 1 === month && viewYear === year;
              const isCurrent =
                index + 1 === currentMonth && viewYear === currentYear;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => selectPeriod(index + 1, viewYear)}
                  aria-pressed={isSelected}
                  title={monthsInRange[index]}
                  className={`h-10 rounded-xl text-sm font-semibold transition ${
                    isSelected
                      ? "bg-gradient-to-br from-primaria to-primariaEscura text-white shadow-card"
                      : isCurrent
                        ? "bg-clara4 text-primaria ring-1 ring-inset ring-primaria/40 hover:bg-clara3"
                        : "text-texto2 hover:bg-clara4 hover:text-primaria"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end border-t border-cinza9 pt-2">
            <button
              type="button"
              onClick={() => selectPeriod(currentMonth, currentYear)}
              className="rounded-full px-3 py-1 text-sm font-semibold text-primaria hover:bg-clara4"
            >
              Mês atual
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
