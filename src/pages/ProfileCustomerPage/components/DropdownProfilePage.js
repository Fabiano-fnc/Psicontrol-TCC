import { EditIcon, Trash, ArchiveIcon } from "../../../icons/icons";

const itemClass =
  "group flex w-full items-center gap-2 px-6 py-2.5 text-left font-['Open Sans'] text-[15px] font-normal leading-5 tracking-normal text-texto2 underline hover:bg-clara3 hover:text-texto2/70";

const DropDownProfile = ({
  customerId,
  onDelete,
  setSelectedPatient,
  openModal,
  customer,
  onArchive,
}) => {
  return (
    <nav className="absolute right-0 top-full z-20 mt-1 w-[220px] rounded-md border border-cinza6 bg-bg2 py-2 shadow-dropShadow">
      <ul>
        <li>
          <button className={itemClass} onClick={() => onArchive(customerId)}>
            <ArchiveIcon />
            Arquivar paciente
          </button>
        </li>
        <li>
          <button
            className={itemClass}
            onClick={() => {
              setSelectedPatient(customer);
              openModal();
            }}
          >
            <EditIcon />
            Editar paciente
          </button>
        </li>
        <li>
          <button className={itemClass} onClick={() => onDelete(customerId)}>
            <Trash />
            Excluir paciente
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default DropDownProfile;
