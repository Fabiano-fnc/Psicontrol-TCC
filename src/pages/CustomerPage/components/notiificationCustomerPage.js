import { notify } from "../../../utils/notification/notify";

export const showEditToast = () =>
  notify.success("Alterações salvas com sucesso!");

export const showArchiveToast = () =>
  notify.success("Paciente arquivado com sucesso!");

export const showDeleteToast = () =>
  notify.success("Paciente excluído com sucesso!");

export const showSuccessToast = () =>
  notify.success("Paciente adicionado com sucesso!");
