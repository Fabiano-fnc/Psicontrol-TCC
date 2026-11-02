const TOKEN_KEY = "authentication_token";

export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token && token !== "null" ? token : null;
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("selectedCalendars");
};

// Qualquer resposta 401 da API significa sessão inválida ou expirada:
// limpa o token e volta para a tela de login.
export const installSessionInterceptor = () => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    if (
      response.status === 401 &&
      url.startsWith(process.env.REACT_APP_API_URL) &&
      window.location.pathname !== "/"
    ) {
      clearSession();
      window.location.assign("/?sessao=expirada");
    }

    return response;
  };
};
