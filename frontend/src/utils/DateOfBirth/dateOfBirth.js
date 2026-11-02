import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
  };

export const formatDateBrazilian = (date) => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy", {locale: ptBR}); 
};

export const parseISODate = (isoDate) => {
    if (!isoDate) return null;
    return parseISO(isoDate);
};

export const formatDateIso = (date) => {
    if(!date) return "";
    return format(date, "yyyy-MM-dd", { locale: ptBR });
}