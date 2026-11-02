import { notify } from "../../../utils/notification/notify";

export const showSaveToast = () => notify.success("Salvo com sucesso!");

export const showDeleteToast = () => notify.success("Item excluído com sucesso!");

export const showLastMonthToast = () =>
  notify.info("Já existem lançamentos no mês selecionado.");

export const showRepeatSuccessToast = () =>
  notify.success("Lançamentos do mês anterior copiados.");
