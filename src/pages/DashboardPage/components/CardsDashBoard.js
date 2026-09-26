const CardDashBoard = ({ title, value }) => {
  return (
    <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-cinza9 bg-bg1 px-4 py-3 shadow-card lg:flex-1">
      <h3 className="truncate font-openSans text-xs font-semibold uppercase tracking-wide text-texto3">
        {title}
      </h3>
      <p className="mt-1 truncate font-ubuntu text-lg font-bold text-texto1 md:text-xl">
        {value}
      </p>
    </div>
  );
};

export default CardDashBoard;
