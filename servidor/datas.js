// ===== Datas =====
// O servidor decide qual é o "dia de hoje" (não confiamos no relógio do navegador).
// Usamos sempre o fuso de Brasília, mesmo que o servidor esteja em outro país.

const FUSO = "America/Sao_Paulo";

// Devolve a data no formato AAAA-MM-DD ("en-CA" é um formato que já sai assim)
function formatarData(data) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(data);
}

function hoje() {
  return formatarData(new Date());
}

// Soma (ou subtrai, com número negativo) dias a uma data AAAA-MM-DD
function somarDias(dataTexto, dias) {
  const data = new Date(dataTexto + "T12:00:00Z");
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

module.exports = { hoje, somarDias, formatarData };
