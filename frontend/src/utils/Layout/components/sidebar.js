import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import logo from "../../../pages/LoginPage/images/PsiText.png";
import { clearSession } from "../../auth/session";
import {
  HomeIcon,
  RecDespIcon,
  UserIcon,
  ConfigIcon,
  GoogleCalendarIcon,
} from "../components/icons/sidebarIcons";

const menuItems = [
  {
    path: "/create-event-form",
    label: ["Página Inicial"],
    Icon: HomeIcon,
    matchPrefix: true,
  },
  { path: "/income", label: ["Receitas e", "Despesas"], Icon: RecDespIcon },
  {
    path: "/customers",
    label: ["Pacientes"],
    Icon: UserIcon,
    activePaths: ["/customers", "/archived", "/create-customer"],
  },
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
    clearSession();
    navigate("/", { replace: true });
  };

  const isActive = (item) =>
    item.matchPrefix
      ? location.pathname.startsWith(item.path)
      : (item.activePaths || [item.path]).some((path) =>
          location.pathname.startsWith(path)
        );

  const itemClass = (active) =>
    `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
      active
        ? "bg-white text-primaria shadow-lg shadow-black/10"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 z-40 flex h-full w-[265px] flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden bg-gradient-to-b from-primaria via-primariaEscura to-[#003B63] px-4 py-5 text-white transform transition-transform duration-300 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } md:translate-x-0 md:shadow-none`}
    >
      {/* Luz e textura de fundo, as mesmas do login. A camada com
          overflow-hidden impede que as luzes criem rolagem no menu. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-destaque/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="relative flex flex-1 flex-col">
        {/* Botão para fechar o menu (somente telas pequenas) */}
        <button
          className="md:hidden self-end rounded-full p-1 text-white hover:bg-white/10"
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
          alt="Psicontrol"
          className="mx-auto mt-2 w-[137px] md:mx-0 md:ml-3 md:mt-3"
        />

        <nav className="mt-6 flex flex-1 flex-col [@media(min-height:860px)]:mt-10">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Menu
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item);
              const { Icon } = item;
              const content = (
                <>
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="font-ubuntu text-[15px] font-medium leading-tight">
                    {item.label.join(" ")}
                  </span>
                </>
              );

              return (
                <li key={item.path}>
                  {item.matchPrefix ? (
                    <button onClick={handleProceed} className={itemClass(active)}>
                      {content}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={itemClass(active)}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Google Agenda */}
          <div className="mt-6 border-t border-white/15 pt-4">
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                <GoogleCalendarIcon />
              </span>
              <span>Ir para Google Agenda</span>
            </a>
          </div>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 12H4m0 0l4-4m-4 4l4 4M20 4v16" />
            </svg>
            Sair
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
