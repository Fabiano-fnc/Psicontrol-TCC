import { Trash, UnarchiveIcon } from "../../../icons/icons";

const itemClass =
  "group flex w-full items-center gap-2 px-6 py-2.5 text-left font-['Open Sans'] text-[15px] font-normal leading-5 tracking-normal text-texto2 underline hover:bg-clara3 hover:text-texto2/70";

const DropDown = ({ customerId, onDelete, onUnarchive }) => {
  return (
    <nav className="absolute right-0 top-full z-20 mt-1 w-[220px] rounded-md border border-cinza6 bg-bg2 py-2 shadow-dropShadow">
      <ul>
        <li>
          <button className={itemClass} onClick={() => onUnarchive(customerId)}>
            <UnarchiveIcon />
            Desarquivar
          </button>
        </li>
        <li>
          <button className={itemClass} onClick={() => onDelete(customerId)}>
            <Trash />
            Excluir do arquivo
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default DropDown;
