// Conselhos profissionais do perfil (mesmas regras de utils/councils.js no backend).
// region: "crp" = regiões do CRP; "uf" = estado; "number" = região numerada.

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const CRP_REGIONS = {
  "01": "DF", "02": "PE", "03": "BA", "04": "MG", "05": "RJ", "06": "SP",
  "07": "RS", "08": "PR", "09": "GO", "10": "PA/AP", "11": "CE", "12": "SC",
  "13": "PB", "14": "MS", "15": "AL", "16": "ES", "17": "RN", "18": "MT",
  "19": "SE", "20": "AM/RR", "21": "PI", "22": "MA", "23": "TO", "24": "RO/AC",
};

export const COUNCILS = {
  CRP: {
    label: "CRP · Psicologia",
    region: "crp",
    digits: [4, 6],
    format: ({ region, number }) => `CRP ${region}/${number}`,
  },
  CRM: {
    label: "CRM · Medicina",
    region: "uf",
    digits: [1, 8],
    format: ({ region, number }) => `CRM-${region} ${number}`,
  },
  CRO: {
    label: "CRO · Odontologia",
    region: "uf",
    digits: [1, 8],
    format: ({ region, number }) => `CRO-${region} ${number}`,
  },
  COREN: {
    label: "COREN · Enfermagem",
    region: "uf",
    digits: [1, 8],
    categories: [
      { id: "ENF", label: "Enfermeiro(a)" },
      { id: "TE", label: "Técnico(a) de enfermagem" },
      { id: "AE", label: "Auxiliar de enfermagem" },
    ],
    format: ({ region, number, category }) =>
      `COREN-${region} ${number}-${category}`,
  },
  CRN: {
    label: "CRN · Nutrição",
    region: "number",
    digits: [1, 8],
    format: ({ region, number }) => `CRN-${region} ${number}`,
  },
  CREFITO: {
    label: "CREFITO · Fisioterapia / T.O.",
    region: "number",
    digits: [1, 8],
    categories: [
      { id: "F", label: "Fisioterapeuta" },
      { id: "TO", label: "Terapeuta ocupacional" },
    ],
    format: ({ region, number, category }) =>
      `CREFITO-${region}/${number}-${category}`,
  },
};

// Opções do seletor de região/estado de cada conselho
export const regionOptions = (type) => {
  const council = COUNCILS[type];
  if (!council) return [];
  if (council.region === "crp") {
    return Object.entries(CRP_REGIONS).map(([id, uf]) => ({
      id,
      label: `${id}ª Região · ${uf}`,
    }));
  }
  if (council.region === "uf") return UFS.map((uf) => ({ id: uf, label: uf }));
  return Array.from({ length: 20 }, (_, i) => ({
    id: String(i + 1),
    label: `${i + 1}ª Região`,
  }));
};

// Descrição automática do serviço no recibo (mesma do backend)
const SERVICES = {
  CRP: "sessões de psicoterapia",
  CRM: "consultas médicas",
  CRO: "atendimentos odontológicos",
  COREN: "atendimentos de enfermagem",
  CRN: "consultas nutricionais",
  CREFITO: "sessões de fisioterapia",
};

export const autoServiceLabel = (type, category) =>
  type === "CREFITO" && category === "TO"
    ? "sessões de terapia ocupacional"
    : SERVICES[type] || "consultas";

// "CRM-SP 123456"; com dados incompletos mostra o que já dá
export const formatRegistry = ({ type, region, number, category }) => {
  const council = COUNCILS[type];
  if (!council || !number) return "";
  if (!region || (council.categories && !category)) return `${type} ${number}`;
  return council.format({ region, number, category });
};

// Exemplo de registro completo, para a prévia antes de preencher
export const exampleRegistry = (type) => {
  const council = COUNCILS[type];
  if (!council) return "";
  const region = regionOptions(type)[council.region === "uf" ? 24 : 5].id;
  const number = "123456".slice(0, council.digits[1]);
  return council.format({ region, number, category: council.categories?.[0].id });
};
