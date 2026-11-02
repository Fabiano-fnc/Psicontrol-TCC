import React from "react";

const Icon = ({ d }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-[18px] w-[18px]"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export const actionIcons = {
  send: "M21 3 10 14M21 3l-6.5 18-4.5-7-7-4.5L21 3Z",
  partial: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0v18",
  confirm: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 9 3 3 5-6",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  edit: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4",
  receipt:
    "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6M9 16h3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
  archive: "M3.5 5h17v4h-17zM5 9v10h14V9M10 13h4",
  calendar:
    "M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z",
};

// Menu de ações flutuante; itens com "danger" ficam em vermelho, separados dos demais
const ActionMenu = ({ title, items }) => {
  const regular = items.filter((item) => !item.danger);
  const danger = items.filter((item) => item.danger);

  const renderItem = (item) => (
    <li key={item.label}>
      <button
        type="button"
        onClick={item.onClick}
        className={`group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition focus:outline-none focus-visible:bg-clara4 ${
          item.danger ? "hover:bg-erro/5" : "hover:bg-clara4"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
            item.danger
              ? "bg-erro/10 text-erro"
              : "bg-clara3 text-primaria group-hover:bg-primaria group-hover:text-white"
          }`}
        >
          <Icon d={actionIcons[item.icon]} />
        </span>
        <span className="min-w-0">
          <span
            className={`block text-sm font-semibold ${
              item.danger ? "text-erro" : "text-texto1"
            }`}
          >
            {item.label}
          </span>
          {item.hint && (
            <span className="block text-xs text-texto3">{item.hint}</span>
          )}
        </span>
      </button>
    </li>
  );

  return (
    <nav
      aria-label={title ? `Ações: ${title}` : "Ações"}
      className="w-[264px] animate-toast-in rounded-2xl border border-cinza9 bg-bg1 p-1.5 shadow-dropShadow"
    >
      {title && (
        <p className="truncate px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-texto3">
          {title}
        </p>
      )}
      <ul>{regular.map(renderItem)}</ul>
      {danger.length > 0 && (
        <ul className="mt-1 border-t border-cinza9 pt-1">
          {danger.map(renderItem)}
        </ul>
      )}
    </nav>
  );
};

export default ActionMenu;
