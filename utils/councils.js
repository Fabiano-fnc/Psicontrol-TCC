// Conselhos profissionais aceitos no perfil e como cada registro é escrito.
// region: "crp" = regiões numeradas do CRP; "uf" = sigla do estado;
// "number" = região numerada informada pelo profissional.

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Regiões do Conselho Regional de Psicologia (01ª a 24ª)
const CRP_REGIONS = {
  "01": "DF", "02": "PE", "03": "BA", "04": "MG", "05": "RJ", "06": "SP",
  "07": "RS", "08": "PR", "09": "GO", "10": "PA/AP", "11": "CE", "12": "SC",
  "13": "PB", "14": "MS", "15": "AL", "16": "ES", "17": "RN", "18": "MT",
  "19": "SE", "20": "AM/RR", "21": "PI", "22": "MA", "23": "TO", "24": "RO/AC",
};

const COUNCILS = {
  CRP: {
    region: "crp",
    digits: [4, 6],
    format: ({ region, number }) => `CRP ${region}/${number}`,
  },
  CRM: {
    region: "uf",
    digits: [1, 8],
    format: ({ region, number }) => `CRM-${region} ${number}`,
  },
  CRO: {
    region: "uf",
    digits: [1, 8],
    format: ({ region, number }) => `CRO-${region} ${number}`,
  },
  COREN: {
    region: "uf",
    digits: [1, 8],
    categories: ["ENF", "TE", "AE"],
    format: ({ region, number, category }) =>
      `COREN-${region} ${number}-${category}`,
  },
  CRN: {
    region: "number",
    digits: [1, 8],
    format: ({ region, number }) => `CRN-${region} ${number}`,
  },
  CREFITO: {
    region: "number",
    digits: [1, 8],
    categories: ["F", "TO"],
    format: ({ region, number, category }) =>
      `CREFITO-${region}/${number}-${category}`,
  },
};

const isValidRegion = (council, region) => {
  if (council.region === "crp") return Object.hasOwn(CRP_REGIONS, region);
  if (council.region === "uf") return UFS.includes(region);
  return /^[1-9]\d?$/.test(region);
};

// Valida o registro completo. Devolve { value } normalizado ou { error }.
const validateRegistry = ({ type, region, number, category }) => {
  const council = COUNCILS[type];
  if (!council) return { error: "Conselho profissional inválido." };

  const cleanRegion = String(region || "").trim().toUpperCase();
  const cleanNumber = String(number || "").replace(/\D/g, "");
  const cleanCategory = String(category || "").trim().toUpperCase();

  if (!isValidRegion(council, cleanRegion)) {
    return {
      error:
        council.region === "uf"
          ? `Escolha o estado do ${type}.`
          : `Escolha a região do ${type}.`,
    };
  }

  const [min, max] = council.digits;
  if (cleanNumber.length < min || cleanNumber.length > max) {
    return {
      error:
        min === max
          ? `O número do ${type} deve ter ${min} dígitos.`
          : `O número do ${type} deve ter de ${min} a ${max} dígitos.`,
    };
  }

  if (council.categories && !council.categories.includes(cleanCategory)) {
    return { error: `Escolha a categoria do ${type}.` };
  }

  return {
    value: {
      type,
      region: cleanRegion,
      number: cleanNumber,
      category: council.categories ? cleanCategory : null,
    },
  };
};

const formatRegistry = ({ type, region, number, category }) => {
  const council = COUNCILS[type];
  if (!council || !number) return null;
  if (!region) return `${type} ${number}`;
  return council.format({ region, number, category });
};

module.exports = { COUNCILS, CRP_REGIONS, UFS, validateRegistry, formatRegistry };
