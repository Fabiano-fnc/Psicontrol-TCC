const CardDashBoard = ({ title, value, isCurrency }) => {
  return (
    <div className="relative flex h-[42px] md:h-[46px] flex-col items-center justify-center rounded-[10px] border md:border-[3px] border-cinza6 bg-clara4 shadow-lg lg:flex-1">
      <h3 className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-clara4 px-1 text-xs md:text-sm font-medium font-ubuntu tracking-tight text-texto2 md:text-texto3">
        {title}
      </h3>

      <p className="w-full text-center text-sm md:text-lg font-medium font-ubuntu text-texto2">
        {isCurrency && <span>R$ </span>}
        <span>{value}</span>
      </p>
    </div>
  );
};

export default CardDashBoard;
