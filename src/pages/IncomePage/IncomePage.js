import { closeOnBackdrop, useEscapeKey } from "../../utils/Modal/useDismiss";
import React, { useState, useEffect, useRef } from "react";
import { Trash, AddIcon } from "../../icons/icons";
import { Months } from "../../utils/Months/months";
import {
  showSaveToast,
  showDeleteToast,
  showLastMonthToast,
} from "./components/toastIncomePage";

const formatCurrency = (value) => {
  if (typeof value !== "string") {
    value = value?.toString() || "0";
  }
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "R$ 0,00";
  return (parseFloat(numericValue) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const parseCurrency = (value) => {
  const numericValue = value.replace(/[^0-9]/g, "");
  return parseFloat(numericValue) || 0;
};

const IncomePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemType, setItemType] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isAddingRevenue, setIsAddingRevenue] = useState([]);
  const [isAddingExpense, setIsAddingExpense] = useState([]);
  const [isExpenseButtonClicked, setIsExpenseButtonClicked] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const revenueNameInputRef = useRef(null); // Ref para o input de nome da próxima receita
  const revenueValueInputRef = useRef(null); // Ref para o input de valor da receita atual
  const expenseNameInputRef = useRef(null); // Ref para o input de nome da próxima despesa
  const expenseValueInputRef = useRef(null);
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  );

  const addExpense = async (name, value) => {
    if (name.trim() && selectedMonth && selectedYear) {
      const newExpense = {
        name: name,
        value: value || "0,00",
      };

      try {
        const formattedDate = `01/${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/income/expense`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newExpense.name,
              value: parseCurrency(newExpense.value) / 100,
              date: formattedDate,
            }),
          }
        );

        const responseData = await response.json();
        if (!response.ok) {
          console.error("Erro ao adicionar despesa:", responseData);
        } else {
          setExpenses((prevExpenses) => [...prevExpenses, responseData]);
        }
      } catch (error) {
        console.error("Erro ao adicionar despesa:", error);
      }
    }
  };

  const addRevenue = async (name, value) => {
    if (name.trim() && value && selectedMonth && selectedYear) {
      const newRevenue = {
        name: name,
        value: value,
      };

      try {
        const formattedDate = `01/${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/income/revenue`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: newRevenue.name,
              value: parseCurrency(newRevenue.value) / 100,
              date: formattedDate,
            }),
          }
        );

        const responseData = await response.json();
        if (!response.ok) {
          console.error("Erro ao adicionar receita:", responseData);
        } else {
          setRevenues((prevRevenues) => [...prevRevenues, responseData]);
        }
      } catch (error) {
        console.error("Erro ao adicionar receita:", error);
      }
    }
  };

  const repeatLastMonthEntries = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/income/entries/repeat-last-month`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedMonth: String(selectedMonth),
            selectedYear: String(selectedYear),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setRevenues((prevRevenues) => [...prevRevenues, ...result.newRevenues]);
        setExpenses((prevExpenses) => [...prevExpenses, ...result.newExpenses]);
      } else if (response.status === 400) {
        // Exibe a notificação de erro com Toastify quando o mês já tem lançamentos
        showLastMonthToast(); // Exibe a notificação de sucesso
      } else {
        console.error("Erro ao duplicar entradas:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao duplicar entradas:", error);
    }
  };

  async function deleteRevenue(id) {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/income/revenue/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "authentication_token"
            )}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setRevenues(revenues.filter((revenue) => revenue.id !== id));
        const data = await response.json();
      } else {
      }
    } catch (error) {}
  }

  async function deleteExpense(id) {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/income/expense/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "authentication_token"
            )}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setExpenses(expenses.filter((expense) => expense.id !== id));
        const data = await response.json();
      } else {
      }
    } catch (error) {}
  }

  const handleDelete = (id, type) => {
    if (type === "expense") {
      deleteExpense(id);
    } else if (type === "revenue") {
      deleteRevenue(id);
    }
  };

  const openModal = (id, type) => {
    setItemToDelete(id);
    setItemType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItemToDelete(null);
    setItemType("");
  };

  const confirmDelete = () => {
    handleDelete(itemToDelete, itemType);
    closeModal();
    showDeleteToast();
    setIsSuccessModalOpen(true);
  };

  const handleClick = async () => {
    const expensePromises = isAddingExpense.map(async (expense) => {
      await addExpense(expense.name, expense.value);
    });

    const revenuePromises = isAddingRevenue.map(async (revenue) => {
      await addRevenue(revenue.name, revenue.value);
    });

    await Promise.all([...expensePromises, ...revenuePromises]);

    showSaveToast();

    setIsAddingExpense([]);
    setIsAddingRevenue([]);
  };

  const handleEnterPressRevenueName = (e) => {
    if (e.key === "Enter" && revenueValueInputRef.current) {
      revenueValueInputRef.current.focus();
    }
  };

  // Função para salvar receita ao pressionar Enter no valor
  const handleEnterPressRevenueValue = async (e) => {
    if (e.key === "Enter") {
      const revenuePromises = isAddingRevenue.map(async (revenue) => {
        if (revenue.name.trim() && revenue.value) {
          await addRevenue(revenue.name, revenue.value);
        }
      });

      await Promise.all(revenuePromises);
      setIsAddingRevenue([{ name: "", value: "" }]);

      // Focar no próximo input de nome da receita
      if (revenueNameInputRef.current) {
        revenueNameInputRef.current.focus();
      }
    }
  };

  // Função para focar no valor da despesa ao pressionar Enter no nome
  const handleEnterPressExpenseName = (e) => {
    if (e.key === "Enter" && expenseValueInputRef.current) {
      expenseValueInputRef.current.focus();
    }
  };

  // Função para salvar despesa ao pressionar Enter no valor
  const handleEnterPressExpenseValue = async (e) => {
    if (e.key === "Enter") {
      const expensePromises = isAddingExpense.map(async (expense) => {
        if (expense.name.trim() && expense.value) {
          await addExpense(expense.name, expense.value);
        }
      });

      await Promise.all(expensePromises);
      setIsAddingExpense([{ name: "", value: "" }]);

      // Focar no próximo input de nome da despesa
      if (expenseNameInputRef.current) {
        expenseNameInputRef.current.focus();
      }
    }
  };

  const loadExpenses = async (month, year) => {
    const monthYear = `${month}/${year.slice(-2)}`;
    console.log(`Chamando API: /income/expense?monthYear=${monthYear}`);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/income/expense?monthYear=${monthYear}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const expenseData = await response.json();
        setExpenses(expenseData);
        console.log("Despesas carregadas:", expenseData);
      }
    } catch (error) {
      console.error("Erro ao carregar despesas:", error);
    }
  };

  const loadRevenues = async (month, year) => {
    const monthYear = `${month}/${year.slice(-2)}`;
    console.log(`Chamando API: /income/revenue?monthYear=${monthYear}`);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/income/revenue?monthYear=${monthYear}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const revenueData = await response.json();
        setRevenues(revenueData);
        console.log("Receitas carregadas:", revenueData);
      }
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
    }
  };

  useEffect(() => {
    const currentDate = new Date();
    const initialMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const initialYear = String(currentDate.getFullYear());

    setSelectedMonth(initialMonth);
    setSelectedYear(initialYear);

    loadExpenses(initialMonth, initialYear);
    loadRevenues(initialMonth, initialYear);
  }, []);

  const handleMonthChange = (month) => {
    const formattedMonth = String(month).padStart(2, "0");
    console.log("Mês selecionado:", formattedMonth);
    setSelectedMonth(formattedMonth);
  };

  const handleYearChange = (year) => {
    const formattedYear = String(year);
    console.log("Ano selecionado:", formattedYear);
    setSelectedYear(formattedYear);
  };

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      setExpenses([]);
      setRevenues([]);

      loadExpenses(selectedMonth, selectedYear);
      loadRevenues(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  const handleCancel = () => {
    setIsAddingRevenue([]);
    setIsAddingExpense([]);
    closeModal();
  };

  const toggleAddRevenue = () => {
    setIsAddingRevenue((prev) => [...prev, { name: "", value: "" }]);
  };

  const toggleAddExpense = () => {
    setIsAddingExpense((prev) => [...prev, { name: "", value: "" }]);
    setIsExpenseButtonClicked((prev) => !prev);
  };

  const updateAddingRevenue = (index, field, value) => {
    setIsAddingRevenue((prev) => {
      const newRevenues = [...prev];
      newRevenues[index][field] = value;
      return newRevenues;
    });
  };

  const updateAddingExpense = (index, field, value) => {
    setIsAddingExpense((prev) => {
      const newExpenses = [...prev];
      newExpenses[index][field] = value;
      return newExpenses;
    });
  };

  useEscapeKey(isModalOpen, closeModal);

  const itemRowClass = "mt-2 flex items-center gap-3";
  const valueBoxClass =
    "flex w-[120px] shrink-0 items-center justify-center rounded-[15px] border-[2px] border-cinza6 bg-neutral-100 p-2 text-sm text-gray-700 md:w-[140px] md:text-base";
  const newInputClass =
    "w-full min-w-0 rounded-md border border-cinza6 bg-neutral-100 p-2 text-gray-700 focus:border-cinza6 focus:outline focus:ring";
  const deleteButtonClass =
    "shrink-0 rounded-full p-2 text-primaria hover:bg-clara3 active:opacity-50";
  const addButtonClass =
    "mt-4 flex items-center rounded-md px-1 py-1 transition-shadow hover:bg-clara3 active:opacity-50";

  return (
    <div className="w-full px-4 pb-8 pt-32 md:px-6 md:pt-28">
      {isModalOpen && (
        <div
          onClick={closeOnBackdrop(closeModal)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bgM/30 p-4 backdrop-blur-[6px]">
          <div className="w-full max-w-[335px] rounded-lg border-2 border-cinza6 bg-white p-6 shadow-lg">
            <p className="mb-6 text-center text-lg md:text-[21px] font-medium font-['Ubuntu'] tracking-tight text-texto2">
              Você tem certeza que deseja
              <span className="text-primaria"> excluir </span>
              este ítem?
            </p>

            <div className="flex justify-around">
              <button
                onClick={closeModal}
                className="h-10 w-[100px] rounded-full border border-primaria bg-white text-center font-semibold text-primaria hover:bg-clara4"
              >
                Não
              </button>
              <button
                onClick={confirmDelete}
                className="h-10 w-[100px] rounded-full bg-primaria text-center font-semibold text-white hover:opacity-90"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[727px] rounded-[15px] border-2 border-cinza6 bg-neutral-100 p-4 shadow-md md:mt-6 md:p-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Months
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            wrapperClassName="z-20 w-full sm:w-[190px]"
          />

          <button
            className="flex h-[40px] w-full items-center justify-center rounded-[10px] border-2 border-primaria bg-neutral-100 px-4 text-center font-['Ubuntu'] text-xs font-medium leading-tight text-primaria shadow drop-shadow-lastMonthShadow hover:bg-clara4 active:opacity-75 active:shadow-innerShadow sm:w-auto md:h-[46px]"
            onClick={repeatLastMonthEntries}
          >
            REPETIR LANÇAMENTOS DO MÊS ANTERIOR
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          {/* Contêiner de Receitas */}
          <div className="min-w-0">
            <h2 className="mb-2 text-lg font-semibold text-texto1">Receitas</h2>
            {revenues.map((revenue, index) => (
              <div key={index} className={itemRowClass}>
                <div className="min-w-0 flex-1 cursor-default break-words text-gray-700">
                  {revenue.name}
                </div>
                <div className={valueBoxClass}>
                  {formatCurrency(revenue.value)}
                </div>
                <button
                  onClick={() => openModal(revenue.id, "revenue")}
                  className={deleteButtonClass}
                  aria-label="Excluir receita"
                >
                  <Trash />
                </button>
              </div>
            ))}
            {isAddingRevenue.map((revenue, index) => (
              <div
                className="mt-2 grid grid-cols-[1fr_120px] gap-3 md:grid-cols-[1fr_140px]"
                key={index}
              >
                <input
                  type="text"
                  placeholder="Nome da receita"
                  value={revenue.name}
                  onChange={(e) =>
                    updateAddingRevenue(index, "name", e.target.value)
                  }
                  onKeyDown={handleEnterPressRevenueName}
                  ref={revenueNameInputRef}
                  className={newInputClass}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Valor"
                  value={formatCurrency(revenue.value)}
                  onChange={(e) =>
                    updateAddingRevenue(index, "value", e.target.value)
                  }
                  onKeyDown={handleEnterPressRevenueValue}
                  ref={revenueValueInputRef}
                  className={newInputClass}
                />
              </div>
            ))}
            <button onClick={toggleAddRevenue} className={addButtonClass}>
              <AddIcon />
              <span className="ml-[8px] text-primaria">Adicionar item</span>
            </button>
          </div>

          {/* Contêiner de Despesas */}
          <div className="min-w-0">
            <h2 className="mb-2 text-lg font-semibold text-texto1">Despesas</h2>
            {expenses.map((expense, index) => (
              <div key={index} className={itemRowClass}>
                <div className="min-w-0 flex-1 cursor-default break-words text-gray-700">
                  {expense.name}
                </div>
                <div className={valueBoxClass}>
                  {formatCurrency(expense.value)}
                </div>
                <button
                  onClick={() => openModal(expense.id, "expense")}
                  className={deleteButtonClass}
                  aria-label="Excluir despesa"
                >
                  <Trash />
                </button>
              </div>
            ))}
            {isAddingExpense.map((expense, index) => (
              <div
                className="mt-2 grid grid-cols-[1fr_120px] gap-3 md:grid-cols-[1fr_140px]"
                key={index}
              >
                <input
                  type="text"
                  placeholder="Nome da despesa"
                  value={expense.name}
                  onChange={(e) =>
                    updateAddingExpense(index, "name", e.target.value)
                  }
                  onKeyDown={handleEnterPressExpenseName}
                  ref={expenseNameInputRef}
                  className={newInputClass}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Valor"
                  value={formatCurrency(expense.value)}
                  onChange={(e) =>
                    updateAddingExpense(index, "value", e.target.value)
                  }
                  onKeyDown={handleEnterPressExpenseValue}
                  ref={expenseValueInputRef}
                  className={newInputClass}
                />
              </div>
            ))}
            <button onClick={toggleAddExpense} className={addButtonClass}>
              <AddIcon />
              <span className="ml-[8px] whitespace-nowrap text-primaria">
                Adicionar item
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="h-[39px] w-[108px] rounded-[100px] border border-primaria text-primaria hover:bg-clara4"
          >
            Cancelar
          </button>
          <button
            onClick={handleClick}
            className="h-[40px] w-[90px] rounded-[100px] bg-primaria text-white drop-shadow-saveShadow hover:opacity-90 active:drop-shadow-sm"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomePage;
