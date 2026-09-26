import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../images/Psicontrol.png";
import "../../index.css";
import { CalendarIcon } from "../../icons/icons";

const SelectCalendarPage = () => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(new Set());
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
        setCalendars(data);

        const activeCalendars = new Set(
          data
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
    fetchCalendars();
  }, []);

  const handleCheckboxChange = async (calendar) => {
    const newSelectedCalendarIds = new Set(selectedCalendarIds);
    const isSelected = newSelectedCalendarIds.has(calendar.calendar_id);

    if (isSelected) {
      newSelectedCalendarIds.delete(calendar.calendar_id);
    } else {
      newSelectedCalendarIds.add(calendar.calendar_id);
    }
    setSelectedCalendarIds(newSelectedCalendarIds);

    const authenticationToken = localStorage.getItem("authentication_token");
    await fetch(
      `${process.env.REACT_APP_API_URL}/events/calendars/selection/${calendar.calendar_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authenticationToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !isSelected,
          calendar_name: calendar.calendar_name,
        }),
      }
    );
  };

  const handleProceed = () => {
    const ids = Array.from(selectedCalendarIds);

    localStorage.setItem("selectedCalendars", JSON.stringify(ids));
    navigate(`/create-event-form?calendarIds=${ids.join(",")}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg1 px-4 py-10 text-center font-sans">
      <img
        src={logo}
        alt="Logo Psicontrol"
        className="mx-auto mb-8 h-auto w-[180px] md:w-[275px]"
      />
      {loading ? (
        <p className="italic text-gray-500">Carregando calendários...</p>
      ) : error ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-texto2">
            {error} Faça login novamente para continuar.
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-[100px] border-2 border-primaria bg-white px-6 py-2 text-[14px] font-bold text-primaria hover:bg-primaria hover:text-white"
          >
            Entrar novamente
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-[380px] flex-col items-center rounded-[8px] border-2 border-solid border-primaria bg-bg1 px-5 py-6 shadow-xl md:px-8">
          <h1 className="mb-6 font-['Ubuntu'] text-[18px] font-normal leading-[26px] text-texto1 md:text-[22px]">
            Escolher agenda
          </h1>
          <h2 className="mb-4 flex items-center justify-center gap-2 border-b border-b-cinza6 pb-1 text-center text-[16px] font-bold text-texto1">
            <CalendarIcon />
            <span>Minhas Agendas</span>
          </h2>

          <div className="w-full">
            {calendars.map((calendar) => (
              <label
                key={calendar.calendar_id}
                htmlFor={calendar.calendar_id}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left text-texto2 hover:bg-clara4"
              >
                <input
                  type="checkbox"
                  className="relative h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-full border-2 border-primaria checked:border-primaria checked:bg-white checked:before:absolute checked:before:inset-0 checked:before:m-auto checked:before:h-[8px] checked:before:w-[8px] checked:before:rounded-full checked:before:bg-primaria checked:before:content-[''] md:h-[20px] md:w-[20px] md:checked:before:h-[10px] md:checked:before:w-[10px]"
                  name="calendar"
                  id={calendar.calendar_id}
                  checked={selectedCalendarIds.has(calendar.calendar_id)}
                  onChange={() => handleCheckboxChange(calendar)}
                />
                <span className="min-w-0 font-bold text-[14px] [overflow-wrap:anywhere] md:text-[15px]">
                  {calendar.calendar_name}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleProceed}
            className="mt-6 cursor-pointer rounded-[100px] border-2 border-solid border-primaria bg-white px-8 py-2 text-[14px] font-bold text-primaria drop-shadow-monthsShadow hover:bg-primaria hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-primaria"
            disabled={selectedCalendarIds.size === 0}
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectCalendarPage;
