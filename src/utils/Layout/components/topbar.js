import React from "react";
import { useLocation } from "react-router-dom";
import "../../../index.css";
import BaseIcon from "./images/BaseIcon.png";

const TopBar = ({ onMenuClick }) => {
  const location = useLocation();

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

  return (
    <div className="fixed top-0 left-0 right-0 md:left-[265px] z-30 flex items-center justify-between gap-3 border-b border-cinza9 bg-bg1/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:px-8 md:py-5">
      {/* Botão hambúrguer visível apenas em telas menores */}
      <button
        className="md:hidden rounded-full p-1 hover:bg-clara3"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-primaria"
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
        alt="Base Icon"
        className="w-[40px] md:hidden"
      />

      {/* Nome da página */}
      <h2
        className={`font-ubuntu text-[15px] font-semibold leading-tight text-texto1 text-right md:mr-auto md:text-left md:text-[24px] ${pageInfo.margin}`}
      >
        {pageInfo.title}
      </h2>
    </div>
  );
};

export default TopBar;
