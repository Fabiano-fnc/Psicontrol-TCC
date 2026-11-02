import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../../index.css";
import BaseIcon from "./images/BaseIcon.png";
import { saudacao } from "../../greeting";

const TopBar = ({ onMenuClick }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/user/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
      },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const firstName = user?.user_name?.trim().split(" ")[0];

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/create-event-form":
      return { title: "Página Inicial", margin: "" };
      // case "/create-event-form":
      //   return { 
      //     title: (
      //       <>
      //         <span className="hidden md:inline">Página Inicial</span>
      //         <span className="block md:hidden">Página<br />Inicial</span>
      //       </>
      //     ), 
      //     margin: "" 
      //   };
      case "/customers":
        return { 
          title: "Pacientes", 
          margin: "" 
        }; // Nome simples, sem alteração
      case "/income":
        return { 
          title: (
            <>
              <span className="hidden md:inline">Receitas e Despesas</span>
              <span className="block md:hidden">Receitas<br />e Despesas</span>
            </>
          ), 
          margin: "" 
        };
      case "/user":
        return { 
          title: (
            <>
              <span className="hidden md:inline">Minhas Configurações</span>
              <span className="block md:hidden">Minhas<br />Configurações</span>
            </>
          ), 
          margin: "" 
        };
      case "/archived":
        return {
          title: (
            <>
              <span className="hidden md:inline">Pacientes Arquivados</span>
              <span className="block md:hidden">Pacientes<br />Arquivados</span>
            </>
          ),
          margin: "",
        };
      case "/create-customer":
        return { title: "Novo Paciente", margin: "" };
      default:
        if (location.pathname.startsWith("/customers/")) {
          return {
            title: (
              <>
                <span className="hidden md:inline">Perfil do Paciente</span>
                <span className="block md:hidden">Perfil do<br />Paciente</span>
              </>
            ),
            margin: "",
          };
        }
        return { 
          title: (
            <>
              <span className="hidden md:inline">Página Não Encontrada</span>
              <span className="block md:hidden">Página<br />Não Encontrada</span>
            </>
          ), 
          margin: "" 
        };
    }
  };
  

  const pageInfo = getPageTitle();

  useEffect(() => {
    const titles = {
      "/create-event-form": "Página Inicial",
      "/customers": "Pacientes",
      "/income": "Receitas e Despesas",
      "/user": "Minhas Configurações",
      "/archived": "Pacientes Arquivados",
      "/create-customer": "Novo Paciente",
    };
    const title =
      titles[location.pathname] ||
      (location.pathname.startsWith("/customers/")
        ? "Perfil do Paciente"
        : "Página Não Encontrada");
    document.title = `${title} · Psicontrol`;
  }, [location.pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 md:left-[265px] z-30 flex items-center justify-between gap-3 bg-gradient-to-r from-primaria to-primariaEscura px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shadow-md md:border-b md:border-cinza9 md:bg-none md:bg-bg1/95 md:px-8 md:py-4 md:text-texto1 md:shadow-none md:backdrop-blur">
      {/* Botão hambúrguer visível apenas em telas menores */}
      <button
        className="md:hidden rounded-full p-1 hover:bg-white/10"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <img
        src={BaseIcon}
        alt=""
        className="w-[36px] brightness-0 invert md:hidden"
      />

      {/* Nome da página */}
      <div className="text-right md:mr-auto md:text-left">
        <p className="hidden text-xs font-semibold uppercase tracking-wider text-texto3 md:block">
          {saudacao()}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h2
          className={`font-ubuntu text-[15px] font-semibold leading-tight md:text-[24px] ${pageInfo.margin}`}
        >
          {pageInfo.title}
        </h2>
      </div>

      {user && (
        <span
          className="hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primaria to-destaque font-ubuntu text-lg font-bold text-white ring-4 ring-clara3 md:flex"
          title={user.user_name}
        >
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt="Foto de perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            user.user_name?.charAt(0)
          )}
        </span>
      )}
    </div>
  );
};

export default TopBar;
