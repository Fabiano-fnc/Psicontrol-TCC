const icons = {
  consultas: (
    <path d="M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />
  ),
  receita: <path d="M4 19V5M4 19h16M8 15l3.5-4 3 2.5L20 7" />,
  liquida: (
    <path d="M3.5 7.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Zm0 0V6a2 2 0 0 1 2-2h10.5M16.5 13.5h.01" />
  ),
  hora: <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
};

// "destaque" usa o mesmo degradê azul do login e do menu lateral
const CardDashBoard = ({ title, value, icon, destaque = false }) => {
  return (
    <div
      className={`relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 shadow-card lg:px-3 2xl:px-4 lg:flex-1 ${
        destaque
          ? "bg-gradient-to-br from-primaria to-primariaEscura text-white"
          : "border border-cinza9 bg-bg1 text-texto1"
      }`}
    >
      {destaque && (
        <span className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-destaque/40 blur-2xl" />
      )}
      {icon && (
        <span
          className={`relative hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${
            destaque ? "bg-white/15 text-white" : "bg-clara3 text-primaria"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            {icons[icon]}
          </svg>
        </span>
      )}
      <div className="relative min-w-0">
        <h3
          className={`truncate font-openSans text-xs font-semibold uppercase tracking-wide ${
            destaque ? "text-white/75" : "text-texto3"
          }`}
        >
          {title}
        </h3>
        <p className="mt-1 truncate font-ubuntu text-lg font-bold md:text-xl">
          {value}
        </p>
      </div>
    </div>
  );
};

export default CardDashBoard;
