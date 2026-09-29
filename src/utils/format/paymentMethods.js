// Formas de pagamento (mesmas chaves de utils/paymentMethods.js no backend)
export const PAYMENT_METHODS = [
  { id: "pix", label: "Pix" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "credito", label: "Crédito" },
  { id: "debito", label: "Débito" },
  { id: "transferencia", label: "Transferência" },
];

export const paymentMethodLabel = (id) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label || "";
