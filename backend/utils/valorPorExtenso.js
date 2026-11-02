// Valor em reais por extenso: 750.5 → "setecentos e cinquenta reais e cinquenta centavos"

const UNIDADES = [
  "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete",
  "dezoito", "dezenove",
];
const DEZENAS = [
  "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta",
  "oitenta", "noventa",
];
const CENTENAS = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
  "seiscentos", "setecentos", "oitocentos", "novecentos",
];

// 0 a 999
const ateMil = (n) => {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const partes = [];
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c) partes.push(CENTENAS[c]);
  if (resto < 20) {
    if (resto) partes.push(UNIDADES[resto]);
  } else {
    partes.push(DEZENAS[Math.floor(resto / 10)]);
    if (resto % 10) partes.push(UNIDADES[resto % 10]);
  }
  return partes.join(" e ");
};

// Inteiro até 999.999.999
const inteiroPorExtenso = (n) => {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1e6);
  const milhares = Math.floor((n % 1e6) / 1000);
  const resto = n % 1000;

  const grupos = [];
  if (milhoes) grupos.push(`${ateMil(milhoes)} ${milhoes === 1 ? "milhão" : "milhões"}`);
  if (milhares) grupos.push(milhares === 1 ? "mil" : `${ateMil(milhares)} mil`);
  if (resto) grupos.push(ateMil(resto));

  // "e" antes do último grupo quando ele é < 100 ou uma centena redonda
  // (mil e duzentos, dois mil e cinco); nos demais, só vírgula/espaço
  if (grupos.length > 1) {
    const ultimo = resto || milhares;
    const conecta = ultimo < 100 || ultimo % 100 === 0;
    const final = grupos.pop();
    return `${grupos.join(" ")}${conecta ? " e " : " "}${final}`;
  }
  return grupos[0];
};

const valorPorExtenso = (valor) => {
  const centavosTotais = Math.round(Number(valor) * 100);
  const reais = Math.floor(centavosTotais / 100);
  const centavos = centavosTotais % 100;

  const partes = [];
  if (reais) {
    // "um milhão de reais", "dois milhões de reais"
    const deReais = reais % 1e6 === 0 ? " de" : "";
    partes.push(`${inteiroPorExtenso(reais)}${deReais} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos) {
    partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }
  return partes.length ? partes.join(" e ") : "zero real";
};

module.exports = { valorPorExtenso };
