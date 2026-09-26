import React, { useRef, useState } from "react";
import { FilterIcon } from "./IconsDashBoard";
import { useOutsideClick } from "../../../utils/OutsideClick/useOutsideClick";

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

  useOutsideClick(filterRef, () => setIsOpen(false));

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
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium font-ubuntu tracking-tight text-primaria underline hover:bg-clara3 active:text-primaria/50"
        aria-expanded={isOpen}
      >
        Filtrar dados
        <FilterIcon />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[200px] md:w-[211px] rounded-md border border-cinza6 bg-clara4 p-3 shadow-md">
          {filterGroups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? "mt-4" : ""}>
              <p className="text-sm md:text-[17px] text-texto2 font-normal font-openSans tracking-tight underline">
                {group.title}
              </p>
              {group.options.map((option) => (
                <label
                  key={option.id}
                  htmlFor={option.id}
                  className="mt-2 flex cursor-pointer items-center text-sm md:text-[15px] text-texto2 font-normal font-openSans tracking-tight"
                >
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={selectedStatus.includes(option.id)}
                    onChange={() => handleCheckboxChange(option.id)}
                    className="relative inline-flex h-[16px] w-[16px] shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-primaria bg-white checked:border-primaria checked:bg-primaria checked:after:absolute checked:after:left-[1px] checked:after:top-[-4px] checked:after:font-bold checked:after:text-white checked:after:content-['✔']"
                  />
                  <span className="ml-2">{option.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterStatusDashBoard;
