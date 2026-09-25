import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import logo from "../../../images/Psicontrol.png";
import {
  HomeIcon,
  RecDespIcon,
  UserIcon,
  ConfigIcon,
  GoogleCalendarIcon,
  BorderIcon,
} from "../components/icons/sidebarIcons";

const menuItems = [
  {
    path: "/create-event-form",
    label: ["Página Inicial"],
    Icon: HomeIcon,
    matchPrefix: true,
  },
  { path: "/income", label: ["Receitas e", "Despesas"], Icon: RecDespIcon },
  { path: "/customers", label: ["Pacientes"], Icon: UserIcon },
  { path: "/user", label: ["Minhas", "Configurações"], Icon: ConfigIcon },
];

const Sidebar = ({ isOpen, onToggle, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(new Set());

  useEffect(() => {
    const savedIds =
      JSON.parse(localStorage.getItem("selectedCalendars")) || [];
    setSelectedCalendarIds(new Set(savedIds));
  }, []);

  const handleProceed = () => {
    onNavigate();
    const ids = Array.from(selectedCalendarIds);
    localStorage.setItem("selectedCalendars", JSON.stringify(ids));
    navigate(`/create-event-form?calendarIds=${ids.join(",")}`);
  };

  const handleLogout = () => {
    navigate("/");
  };

  const isActive = (item) =>
    item.matchPrefix
      ? location.pathname.startsWith(item.path)
      : location.pathname === item.path;

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 flex h-full w-[265px] flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden bg-bg1 p-5 text-gray-800 shadow-default md:shadow-none transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      {/* Botão para fechar o menu (somente telas pequenas) */}
      <button
        className="md:hidden self-end rounded-full p-1 text-primaria hover:bg-clara3"
        onClick={onToggle}
        aria-label="Fechar menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <img
        src={logo}
        alt="Logo Psicontrol"
        className="mx-auto w-[110px] md:ml-[22px] md:w-[130px] [@media(min-height:860px)]:md:mt-[18px] [@media(min-height:860px)]:md:w-[155px]"
      />

      <nav className="mt-6 flex flex-1 flex-col [@media(min-height:860px)]:mt-[70px]">
        <ul className="ml-[11px] space-y-2 [@media(min-height:760px)]:space-y-[27px]">
          {menuItems.map((item) => {
            const active = isActive(item);
            const { Icon } = item;
            const textColor = active
              ? "text-primaria"
              : "text-texto2 group-hover:text-primaria";
            const content = (
              <>
                <BorderIcon isSelected={active} />
                <Icon className={`h-8 w-8 ${textColor}`} />
                <span
                  className={`text-lg font-medium font-['Ubuntu'] tracking-tight text-left ${textColor}`}
                >
                  {item.label.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </>
            );
            const linkClass = "group flex w-full items-center";

            return (
              <li key={item.path} className="-mx-8">
                {item.matchPrefix ? (
                  <button onClick={handleProceed} className={linkClass}>
                    {content}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={linkClass}
                    onClick={onNavigate}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Google Agenda */}
        <div className="mt-6 border-t border-texto2/50 pt-4">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center font-medium font-['Ubuntu'] tracking-tight text-primaria underline hover:opacity-80"
          >
            <GoogleCalendarIcon className="mr-2 h-6 w-6 text-primaria" />
            <span className="ml-3">Ir para Google Agenda</span>
          </a>
        </div>

        <button
          onClick={handleLogout}
          className="mt-auto self-start pt-6 font-medium font-['Ubuntu'] text-primaria underline hover:opacity-80"
        >
          Sair
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
