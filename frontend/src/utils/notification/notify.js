// Sistema de notificações do app (substitui o react-toastify).
// Qualquer arquivo chama notify.success/error/info; o <Toaster /> exibe.
const listeners = new Set();
let nextId = 1;

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = (type, message) => {
  const toast = { id: nextId++, type, message };
  listeners.forEach((listener) => listener(toast));
};

export const notify = {
  success: (message) => emit("success", message),
  error: (message) => emit("error", message),
  info: (message) => emit("info", message),
};
