import { useState } from "react";
import { useModal } from "../Modal/useModal";
import { VerifyIcon, CheckIcon, SetaIcon } from "../../icons/icons";

export const Months = ({
  onMonthChange,
  onYearChange,
  selectedMonth,
  selectedYear,
  wrapperClassName = "flex-1 ml-3 top-3 md:z-30",
}) => {
  const { isModalOpen, openModal, closeModal } = useModal();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [showingMonths, setShowingMonths] = useState(true);

  const getYearsRange = () => {
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

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

  const handleMonthClick = (index) => {
    onMonthChange(index + 1);
    closeModal(); // Fecha o modal após selecionar o mês
  };

  const handleYearClick = (year) => {
    onYearChange(year);
    setShowingMonths(true); // Mostra os meses após selecionar o ano
  };

  const toggleModal = () => {
    isModalOpen ? closeModal() : openModal();
  };

  return (
    <div className={`relative drop-shadow-monthsShadow active:drop-shadow-addShadow ${wrapperClassName}`}>
      <button
        onClick={toggleModal}
        className="w-full md:h-[46px] h-[40px] px-3 bg-primaria active:opacity-80 rounded-[10px] shadow flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <VerifyIcon />
          <span className="text-texto4 md:text-[21px] text-[16px] font-medium font-['Ubuntu'] tracking-tight">
            <span className="block md:hidden">{`${monthsInRangeShort[selectedMonth - 1]}/${selectedYear.toString().slice(-2)}`}</span>
            <span className="hidden md:block">{`${monthsInRange[selectedMonth - 1]}/${selectedYear.toString().slice(-2)}`}</span>
          </span>
        </div>
        <SetaIcon />
      </button>
      {isModalOpen && (
        <div className="w-[213px] h-[277px] md:w-full max-w-full flex flex-col items-center mt-2 bg-neutral-100 shadow-lg rounded-2xl border border-[#81a0ae] p-2 absolute z-50">
          <div className="flex items-center justify-between w-full px-5 py-1 mb-2 border-b border-[#cac4d0]">
            <button
              onClick={() => setShowingMonths(true)}
              className={`text-[#5c5c5c] text-sm font-normal font-['Open Sans'] tracking-tight hover:text-black ${
                showingMonths ? "font-bold text-black" : ""
              }`}
            >
              {showingMonths ? "Meses" : monthsInRange[selectedMonth - 1]}
            </button>
            <button
              onClick={() => setShowingMonths(false)}
              className={`text-[#5c5c5c] text-sm font-normal font-['Open Sans'] tracking-tight hover:text-black ${
                !showingMonths ? "font-bold text-black" : ""
              }`}
            >
              {selectedYear}
            </button>
          </div>
          <div className="flex flex-col w-full overflow-y-auto max-h-60">
            {showingMonths
              ? monthsInRange.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthClick(index)}
                    className={`w-full px-3 py-2 text-left rounded-md hover:bg-d_medio3 ${
                      selectedMonth - 1 === index ? "flex items-center" : ""
                    }`}
                  >
                    {selectedMonth - 1 === index && <CheckIcon />}
                    <span className="block md:hidden  ">
                      {monthsInRange[index]}
                    </span>
                    <span className="hidden md:block ">{month}</span>
                  </button>
                ))
              : getYearsRange().map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearClick(year)}
                    className={`w-full px-3 py-2 text-left rounded-md hover:bg-blue-100 ${
                      selectedYear === year
                        ? "bg-blue-200 flex items-center"
                        : ""
                    }`}
                  >
                    {selectedYear === year && <CheckIcon />}
                    {year}
                  </button>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};
