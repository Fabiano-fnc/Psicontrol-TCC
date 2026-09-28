import React from "react";
import ActionMenu from "./ActionMenu";

const DropDownDashBoard = ({ eventName, onVincular, onExcluir }) => (
  <ActionMenu
    title={eventName}
    items={[
      {
        icon: "link",
        label: "Vincular paciente",
        hint: "Associar a um cadastro",
        onClick: onVincular,
      },
      {
        icon: "trash",
        label: "Excluir evento",
        hint: "Também apaga do Google Agenda",
        danger: true,
        onClick: onExcluir,
      },
    ]}
  />
);

export default DropDownDashBoard;
