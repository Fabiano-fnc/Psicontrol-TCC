// Formas de pagamento aceitas ao registrar um pagamento
const PAYMENT_METHODS = {
  pix: "Pix",
  dinheiro: "dinheiro",
  credito: "cartão de crédito",
  debito: "cartão de débito",
  transferencia: "transferência bancária",
};

// Valor vindo da requisição: undefined = não mexe; "" / null = não informado
const parsePaymentMethod = (value) => {
  if (value === undefined) return { skip: true };
  if (value === null || value === "") return { value: null };
  return Object.hasOwn(PAYMENT_METHODS, value)
    ? { value }
    : { error: "Forma de pagamento inválida." };
};

module.exports = { PAYMENT_METHODS, parsePaymentMethod };
