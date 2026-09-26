import React from "react";
import { GoogleIcon } from "./components/LoginIcons";
import PsiText from "./images/PsiText.png";
import BoxBlue from "./images/BoxBlue.png";
import BoxBlueCourt from "./images/BoxBlueCourt.png";

const Login = () => {
  const sessionExpired =
    new URLSearchParams(window.location.search).get("sessao") === "expirada";

  const handleLogin = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/google`);
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {}
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white md:flex">
      {/* Cubos decorativos */}
      <img
        src={BoxBlueCourt}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-10 w-[230px] opacity-50 md:bottom-auto md:right-[-40px] md:top-1/2 md:w-[400px] md:-translate-y-1/2 lg:w-[520px]"
      />
      <img
        src={BoxBlue}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-40 left-6 w-[70px] opacity-50 md:bottom-auto md:left-[calc(50%+96px)] md:top-0 md:w-[110px]"
      />
      <img
        src={BoxBlue}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute hidden opacity-50 md:bottom-[80px] md:right-[160px] md:block md:w-[110px]"
      />

      {/* Painel azul */}
      <div className="relative flex flex-col bg-primaria px-6 pb-28 pt-12 md:min-h-screen md:w-1/2 md:px-10 md:pb-10 md:pt-10">
        <img src={PsiText} alt="Psicontrol" className="h-auto w-[137px]" />

        <div className="mt-10 md:my-auto">
          <h1 className="scale-y-125 font-['Oswald-Bold',Helvetica] text-[24px] font-bold text-white md:text-[30px]">
            Vamos Começar!
          </h1>
          <p className="mt-2 max-w-[260px] font-['Questrial-Regular',Helvetica] text-[15px] text-white md:text-[19px]">
            Faça o login com seu e-mail profissional.
          </p>
        </div>
      </div>

      {/* Cartão de login */}
      <div className="relative z-10 mx-auto -mt-16 w-[calc(100%-3rem)] max-w-[392px] md:absolute md:left-1/2 md:top-1/2 md:mt-0 md:w-[392px] md:-translate-x-1/2 md:-translate-y-1/2">
        <div className="flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center drop-shadow-loginShadow">
          {sessionExpired && (
            <p className="mb-4 rounded-md bg-clara4 px-3 py-2 text-sm text-texto2">
              Sua sessão expirou. Entre novamente para continuar.
            </p>
          )}
          <p className="text-[16px] font-semibold tracking-wide text-gray-700 md:text-[20px]">
            Entrar com sua conta Google
          </p>

          <button
            onClick={handleLogin}
            className="mt-6 flex items-center rounded-full border-2 border-primaria px-4 py-2 shadow hover:bg-gray-100 focus:outline-none md:mt-8"
          >
            <span className="mr-2">
              <GoogleIcon className="h-[18px] w-[18px]" />
            </span>
            Entrar com o Google
          </button>
        </div>
      </div>
    </div>
  );
};

export { Login };
