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

// Segunda-feira da semana de uma data AAAA-MM-DD
function segundaDaSemana(dataTexto) {
  const diaDaSemana = new Date(dataTexto + "T12:00:00Z").getUTCDay(); // 0 = domingo
  const diasDesdeSegunda = (diaDaSemana + 6) % 7;
  return somarDias(dataTexto, -diasDesdeSegunda);
}

// Última semana COMPLETA (segunda a domingo) antes da data informada
function ultimaSemanaCompleta(dataTexto) {
  const inicio = somarDias(segundaDaSemana(dataTexto), -7);
  return { inicio: inicio, fim: somarDias(inicio, 6) };
}

// Último mês COMPLETO antes da data informada
function ultimoMesCompleto(dataTexto) {
  const primeiroDiaDoMesAtual = dataTexto.slice(0, 8) + "01";
  const fim = somarDias(primeiroDiaDoMesAtual, -1);
  return { inicio: fim.slice(0, 8) + "01", fim: fim };
}

module.exports = { hoje, somarDias, formatarData, segundaDaSemana, ultimaSemanaCompleta, ultimoMesCompleto };
