import React from "react";
import { TrashIconDash, VinculateIcon } from "./IconsDashBoard";

const itemClass =
  "group flex w-full items-center gap-3 px-4 py-2 text-left text-sm md:text-F15 text-texto2 font-normal font-openSans tracking-tight underline hover:bg-clara3 active:text-texto2/50";

const DropDownDashBoard = ({ onVincular, onExcluir }) => {
  return (
    <nav className="w-[200px] md:w-[210px] rounded-md border border-solid border-cinza6 bg-bg2 py-2 shadow-default">
      <ul>
        <li>
          <button onClick={onVincular} className={itemClass}>
            <VinculateIcon />
            <span>Vincular paciente</span>
          </button>
        </li>
        <li>
          <button onClick={onExcluir} className={itemClass}>
            <TrashIconDash />
            <span>Excluir paciente</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default DropDownDashBoard;
