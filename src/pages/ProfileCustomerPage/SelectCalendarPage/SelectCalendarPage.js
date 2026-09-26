import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../images/Psicontrol.png";
import "../../index.css";
import { CalendarIcon } from "../../icons/icons";

const SelectCalendarPage = () => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalendars = async () => {
      const authenticationToken = localStorage.getItem("authentication_token");

      if (authenticationToken) {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/events/calendars`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authenticationToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCalendars(data);

          const activeCalendars = new Set(
            data
              .filter((calendar) => calendar.enabled)
              .map((calendar) => calendar.id)
          );
          setSelectedCalendarIds(activeCalendars);

          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    };

    fetchCalendars();
  }, []);

  const handleCheckboxChange = async (calendar) => {
    const newSelectedCalendarIds = new Set(selectedCalendarIds);
    const isSelected = newSelectedCalendarIds.has(calendar.id);

    if (isSelected) {
      newSelectedCalendarIds.delete(calendar.id);
    } else {
      newSelectedCalendarIds.add(calendar.id);
    }
    setSelectedCalendarIds(newSelectedCalendarIds);

    const authenticationToken = localStorage.getItem("authentication_token");
    await fetch(
      `${process.env.REACT_APP_API_URL}/events/calendars/selection/${calendar.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authenticationToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !isSelected, 
          calendar_name: calendar.summary,
        }),
      }
    );
  };

  const handleProceed = () => {
    const ids = Array.from(selectedCalendarIds);
    
    localStorage.setItem("selectedCalendars", JSON.stringify(ids));
    console.log("Calendários selecionados salvos no localStorage:", ids);
  
    navigate(`/create-event-form?calendarIds=${ids.join(",")}`);
  };
  

  return (
    <div className="flex flex-col items-center justify-center h-screen mx-auto  p-8 bg-bg1 text-center font-sans">
      <img
        src={logo}
        alt="Logo"
        className="mx-auto mb-8 w-[275px]  h-[165px]"
      />
      {loading ? (
        <p className="italic text-gray-500">Carregando calendários...</p>
      ) : error ? (
        <p className="italic text-gray-500">{error}</p>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center gap-8">
          <div className="flex w-auto p-[5px] rounded-[8px] border-2 border-solid border-primaria flex-col items-center justify-center">
            <h1 className="mb-8 text-[25px] leading-[29px] text-texto1 font-ubuntu font-normal">
              Escolher agenda
            </h1>
            <h2 className="mb-[16px] border-b border-b-cinza6 text-center text-[19.2px] text-texto1 font-bold flex items-center justify-center">
              <CalendarIcon />
              <span>Minhas Agendas</span>
            </h2>
            {calendars.map((calendar) => (
              <div key={calendar.id} className="mb-2 flex w-full text-texto2">
                <input
                  type="checkbox"
                  className="mr-2"
                  name="calendar"
                  id={calendar.id}
                  checked={selectedCalendarIds.has(calendar.id)}
                  onChange={() => handleCheckboxChange(calendar)} 
                />
                <label htmlFor={calendar.id} className="font-bold">
                  {calendar.summary}
                </label>
              </div>
            ))}

            <button
              onClick={handleProceed} 
              className="rounded-[100px] mt-8 block w-[69px] h-[40px] cursor-pointer border-none bg-primaria p-4 text-lg leading-[8px] text-texto4 hover:bg-primaria"
              disabled={selectedCalendarIds.size === 0}
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectCalendarPage;
