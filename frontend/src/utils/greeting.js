// Saudação conforme o horário local ("Bom dia", "Boa tarde", "Boa noite")
export const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
};
