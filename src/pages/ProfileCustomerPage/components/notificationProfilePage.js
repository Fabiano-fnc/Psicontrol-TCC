import { notify } from "../../../utils/notification/notify";

export const showDeleteProfileToast = () =>
  notify.success("Paciente excluído com sucesso!");

export const showArchiveProfileToast = () =>
  notify.success("Paciente arquivado com sucesso!");
