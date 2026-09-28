import React, { useCallback, useRef, useState } from "react";
import { useOutsideClick } from "../../../utils/OutsideClick/useOutsideClick";
import { useEscapeKey } from "../../../utils/Modal/useDismiss";

const filterGroups = [
  {
    title: "Pagamentos",
    options: [
      { id: "aberto", label: "Não confirmados" },
      { id: "pago", label: "Confirmados" },
      { id: "parcial", label: "Parciais" },
    ],
  },
  {
    title: "Cobrança",
    options: [
      { id: "nao-realizada", label: "Não Realizada" },
      { id: "realizada", label: "Realizada" },
    ],
  },
];

const FilterStatusDashBoard = ({ selectedStatus, onChangeStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);
  useOutsideClick(filterRef, close);
  useEscapeKey(isOpen, close);

  const activeCount = selectedStatus.length;

  const handleCheckboxChange = (status) => {
    if (selectedStatus.includes(status)) {
      onChangeStatus(selectedStatus.filter((item) => item !== status));
    } else {
      onChangeStatus([...selectedStatus, status]);
    }
  };

  return (
    <div ref={filterRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-card transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-clara3 ${
          isOpen || activeCount > 0
            ? "border-primaria/60 bg-clara4 text-primaria"
            : "border-cinza9 bg-bg1 text-texto2 hover:border-primaria/40 hover:text-primaria"
        } ${isOpen ? "ring-4 ring-clara3" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="h-[18px] w-[18px]"
          aria-hidden="true"
        >
          <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        Filtros
        {activeCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primaria px-1.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Filtrar dados"
          className="absolute right-0 top-full z-50 mt-2 w-[248px] animate-toast-in rounded-2xl border border-cinza9 bg-bg1 p-2 shadow-dropShadow"
        >
          {filterGroups.map((group, groupIndex) => (
            <div
              key={group.title}
              className={groupIndex > 0 ? "mt-1 border-t border-cinza9 pt-1" : ""}
            >
              <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-texto3">
                {group.title}
              </p>
              {group.options.map((option) => {
                const checked = selectedStatus.includes(option.id);
                return (
                  <label
                    key={option.id}
                    htmlFor={option.id}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm font-openSans transition ${
                      checked
                        ? "bg-clara4 font-semibold text-primaria"
                        : "text-texto2 hover:bg-clara4"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={option.id}
                      checked={checked}
                      onChange={() => handleCheckboxChange(option.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-primaria/40 ${
                        checked
                          ? "border-primaria bg-primaria text-white"
                          : "border-cinza6 bg-bg1"
                      }`}
                      aria-hidden="true"
                    >
                      {checked && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="m5 12 5 5 9-10" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </label>
                );
              })}
            </div>
          ))}

          <div className="mt-1 flex items-center justify-between border-t border-cinza9 px-1 pt-2">
            <button
              type="button"
              onClick={() => onChangeStatus([])}
              disabled={activeCount === 0}
              className="rounded-full px-3 py-1 text-sm font-semibold text-texto3 hover:bg-clara4 hover:text-primaria disabled:pointer-events-none disabled:opacity-40"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-primaria px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Pronto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterStatusDashBoard;
