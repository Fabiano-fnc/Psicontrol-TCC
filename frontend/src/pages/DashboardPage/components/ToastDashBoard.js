import { notify } from "../../../utils/notification/notify";

export const ShowVinculateToast = () =>
  notify.success("Paciente vinculado com sucesso!");

export const showDeleteToast = () =>
  notify.success("Paciente excluído com sucesso!");

export const showConfirmPaymentToast = () =>
  notify.success("Pagamento confirmado com sucesso!");
