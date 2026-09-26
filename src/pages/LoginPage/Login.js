import React, { useEffect, useState } from "react";
import { GoogleIcon } from "./components/LoginIcons";
import PsiText from "./images/PsiText.png";
import { notify } from "../../utils/notification/notify";

const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
};

const recursos = [
  {
    titulo: "Agenda sincronizada",
    texto: "Suas consultas do Google Agenda direto no sistema.",
    icone: (
      <path d="M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />
    ),
  },
  {
    titulo: "Financeiro sem planilhas",
    texto: "Receitas, despesas e lucro do mês em um só lugar.",
    icone: <path d="M4 19V5M4 19h16M8 15l3.5-4 3 2.5L20 7" />,
  },
  {
    titulo: "Pacientes organizados",
    texto: "Cadastro, histórico e pagamentos de cada paciente.",
    icone: (
      <path d="M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 3.65a3.5 3.5 0 0 1 0 6.7" />
    ),
  },
];

const Icone = ({ children, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

// Cartões flutuantes que ilustram o sistema no painel azul
const Vitrine = () => (
  <div className="relative mx-auto h-[250px] w-full max-w-[470px]" aria-hidden="true">
    <div className="absolute left-0 top-0 w-[290px] rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-md motion-safe:animate-float">
      <p className="text-xs uppercase tracking-wider text-white/70">Próxima consulta</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-ubuntu font-bold">
          MA
        </span>
        <div>
          <p className="font-semibold leading-tight">Maria A.</p>
          <p className="whitespace-nowrap text-sm text-white/75">Hoje · 14:00</p>
        </div>
        <span className="ml-auto rounded-full bg-emerald-400/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-950">
          Confirmada
        </span>
      </div>
    </div>

    <div
      className="absolute bottom-0 right-0 w-[220px] rounded-2xl bg-white p-4 text-texto1 shadow-2xl motion-safe:animate-float-slow"
      style={{ animationDelay: "-3s" }}
    >
      <p className="text-xs uppercase tracking-wider text-texto3">Lucro do mês</p>
      <p className="mt-1 font-ubuntu text-2xl font-bold text-primaria">R$ 8.420</p>
      <div className="mt-3 flex h-12 items-end gap-1.5">
        {[40, 55, 35, 70, 60, 85].map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t-md ${i === 5 ? "bg-primaria" : "bg-d_medio3"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-sucesso">▲ 12% em relação ao mês anterior</p>
    </div>
  </div>
);

const Login = () => {
  const [carregando, setCarregando] = useState(false);
  const sessionExpired =
    new URLSearchParams(window.location.search).get("sessao") === "expirada";

  useEffect(() => {
    document.title = "Entrar · Psicontrol";
  }, []);

  const handleLogin = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/google`);
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      throw new Error("authUrl ausente");
    } catch (error) {
      notify.error("Não foi possível conectar ao servidor. Tente novamente.");
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-clara4 lg:flex">
      {/* Painel da marca */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primaria via-primariaEscura to-[#003B63] px-6 pb-24 pt-10 text-white lg:flex lg:min-h-screen lg:w-[55%] lg:flex-col lg:px-14 lg:pb-12 lg:pt-12">
        {/* Luzes e textura de fundo */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-destaque/40 blur-3xl motion-safe:animate-blob" />
        <div
          className="pointer-events-none absolute -bottom-32 right-[-60px] h-96 w-96 rounded-full bg-sky-300/25 blur-3xl motion-safe:animate-blob"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex h-full flex-col">
          <img src={PsiText} alt="Psicontrol" className="h-auto w-[137px]" />

          <div className="mt-10 max-w-[560px] motion-safe:animate-fade-up lg:mt-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Feito para psicólogos
            </span>
            <h1 className="mt-4 font-ubuntu text-[30px] font-bold leading-tight lg:text-[40px]">
              Menos planilhas,
              <br />
              <span className="bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent">
                mais tempo para cuidar.
              </span>
            </h1>
            <p className="mt-3 text-[15px] text-white/80 lg:text-[17px]">
              Agenda, pacientes e financeiro do seu consultório reunidos em um só lugar.
            </p>
          </div>

          <ul className="mt-8 hidden max-w-[480px] space-y-4 lg:block">
            {recursos.map((r, i) => (
              <li
                key={r.titulo}
                className="flex items-start gap-3 motion-safe:animate-fade-up"
                style={{ animationDelay: `${0.15 * (i + 1)}s` }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Icone>{r.icone}</Icone>
                </span>
                <div>
                  <p className="font-semibold">{r.titulo}</p>
                  <p className="text-sm text-white/70">{r.texto}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 hidden lg:mt-auto lg:block">
            <Vitrine />
          </div>
        </div>
      </section>

      {/* Área de login */}
      <section className="relative z-10 -mt-14 flex flex-1 items-start justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:px-10">
        <div className="w-full max-w-[400px] motion-safe:animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-3xl bg-white p-7 shadow-card ring-1 ring-cinza9 lg:p-9">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clara3 text-primaria">
              <Icone className="h-6 w-6">
                <path d="M12 21s-7.5-4.35-7.5-10.2A4.3 4.3 0 0 1 12 8.1a4.3 4.3 0 0 1 7.5 2.7C19.5 16.65 12 21 12 21Z" />
              </Icone>
            </span>

            <h2 className="mt-5 font-ubuntu text-[26px] font-bold text-texto1">
              {saudacao()}!
            </h2>
            <p className="mt-1 text-[15px] text-texto3">
              Entre com a conta Google do seu consultório para continuar.
            </p>

            {sessionExpired && (
              <p className="mt-5 flex items-start gap-2 rounded-xl border border-aviso/40 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                <Icone className="mt-0.5 h-4 w-4 shrink-0">
                  <path d="M12 8v5M12 16.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
                </Icone>
                Sua sessão expirou. Entre novamente para continuar.
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={carregando}
              className="group mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-cinza6 bg-white px-4 py-3 font-semibold text-texto2 shadow-sm transition hover:-translate-y-0.5 hover:border-primaria hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
            >
              {carregando ? (
                <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-cinza6 border-t-primaria" />
              ) : (
                <GoogleIcon />
              )}
              {carregando ? "Redirecionando..." : "Entrar com o Google"}
            </button>

            <div className="mt-7 flex items-center gap-2 border-t border-cinza9 pt-5 text-xs text-texto3">
              <Icone className="h-4 w-4 shrink-0 text-sucesso">
                <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
                <path d="m9 12 2 2 4-4" />
              </Icone>
              Acesso seguro pelo Google. Não guardamos sua senha.
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-texto3">
            © {new Date().getFullYear()} Psicontrol · Gestão para consultórios de psicologia
          </p>
        </div>
      </section>
    </div>
  );
};

export { Login };
