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
    <div className="fixed top-0 left-0 right-0 md:left-[265px] z-30 flex justify-between items-center gap-3 p-4 max-md:pt-12 bg-bg1 rounded-b-[35px] md:rounded-b-none drop-shadow-topbatShadow md:drop-shadow-none">
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
        className="w-[55px] md:hidden opacity-100"
      />

      {/* Nome da página */}
      <h2
        className={`md:text-[28px] text-[15px] text-primaria font-semibold text-right md:text-left md:mr-auto ${pageInfo.margin}`}
      >
        {pageInfo.title}
      </h2>
    </div>
  );
};

export default TopBar;
