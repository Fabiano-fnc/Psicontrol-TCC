import {
  Trash,
  UserIconBorder,
  EditIcon,
  ArchiveIcon,
} from "../../../icons/icons";
import { Link } from "react-router-dom";

const itemClass =
  "group flex w-full items-center gap-2 px-6 py-2.5 text-left font-openSans text-[15px] font-normal leading-5 tracking-normal text-texto2 underline hover:bg-clara3 hover:text-texto2/70";

const DropDonw = ({
  customerId,
  onDelete,
  setSelectedPatient,
  openModal,
  customers,
  onArchive,
}) => {
  return (
    <nav className="absolute right-0 top-full z-20 mt-1 w-[220px] rounded-md border border-solid border-cinza6 bg-bg2 py-2 shadow-default">
      <ul>
        <li>
          <Link to={`/customers/${customerId}/profile`} className={itemClass}>
            <UserIconBorder />
            Conta do paciente
          </Link>
        </li>
        <li>
          <button
            className={itemClass}
            onClick={() => {
              const patient = customers.find(
                (c) => c.customer_id === customerId
              );
              if (patient) {
                setSelectedPatient(patient);
              }
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
        <li>
          <button className={itemClass} onClick={() => onArchive(customerId)}>
            <ArchiveIcon />
            Arquivar Paciente
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default DropDonw;
