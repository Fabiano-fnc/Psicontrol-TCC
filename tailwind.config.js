/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca
        primaria: "#006BA8",
        primariaEscura: "#00558A",
        destaque: "#0EA5E9",
        bgM: "#0EA5E9",
        d_medio3: "#BAE0F5",
        // Superfícies
        bg1: "#FFFFFF",
        bg2: "#FFFFFF",
        clara4: "#F1F6FB",
        clara3: "#DCEBF8",
        // Bordas
        cinza6: "#CBD5E1",
        cinza8: "#B6CAD3",
        cinza9: "#E2E8F0",
        // Texto
        texto1: "#0F172A",
        texto2: "#334155",
        texto3: "#64748B",
        texto4: "#F8FAFC",
        // Estados
        aviso: "#F59E0B",
        sucesso: "#16A34A",
        erro: "#DC2626",
      },
      boxShadow: {
        default: "0px 4px 4px rgba(0, 0, 0, 0.2)",
        innerShadow: "inset 0px 4px 4px rgba(0, 0, 0, 0.25)",
        dropShadow: "0px 4px 12px rgba(15, 23, 42, 0.10)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
      },
      dropShadow: {
        addShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
        saveShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
        monthsShadow: "0px 2px 6px rgba(0, 107, 168, 0.25)",
        lastMonthShadow: "0px 2px 4px rgba(0, 0, 0, 0.10)",
        editShadow: "0px 1px 2px rgba(0, 0, 0, 0.10)",
        loginShadow: "0px 12px 32px rgba(15, 23, 42, 0.18)",
        topbatShadow: "0px 2px 8px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.08)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        "page-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        blob: "blob 18s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        // Sem fill-mode: ao terminar não deixa transform, que quebraria
        // os modais com position: fixed dentro das páginas
        "page-in": "page-in 0.35s ease-out",
      },
      letterSpacing: {
        normal: "0.25px",
      },
      fontSize: {
        F8: "8px",
        F9: "9px",
        F10: "10px",
        F15: "15px",
        F17: "17px",
        F20: "20px",
        F21: "21px",
        F25: "25px",
      },
      fontFamily: {
        ubuntu: ["Ubuntu", "system-ui", "sans-serif"],
        openSans: ["'Open Sans'", "system-ui", "sans-serif"],
        sans: ["'Open Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        B10: "10px",
        B15: "15px",
      },
    },
  },
  plugins: [],
};
