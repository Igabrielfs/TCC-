// ===== Prazo de guarda dos dados (LGPD) =====
// Check-ins e participações mais antigos que o prazo são apagados.
// O prazo padrão é de 365 dias e pode ser mudado com RETENCAO_DIAS no .env
// (o prazo definitivo ainda precisa ser decidido com o Sicredi: veja o PLANO.md).

const { hoje, somarDias } = require("./datas");

const PRAZO_PADRAO = 365;

// Lê o prazo do .env. Aceita só números inteiros entre 30 e 3650 dias.
function prazoEmDias(texto) {
  if (texto === undefined || texto === "") {
    return PRAZO_PADRAO;
  }
  const dias = Number(texto);
  if (!Number.isInteger(dias) || dias < 30 || dias > 3650) {
    throw new Error("RETENCAO_DIAS deve ser um número inteiro entre 30 e 3650.");
  }
  return dias;
}

// Apaga o que passou do prazo e devolve quantas respostas foram apagadas
function apagarDadosAntigos(banco, dias, dataDeHoje = hoje()) {
  const limite = somarDias(dataDeHoje, -dias);
  const { changes } = banco.prepare("DELETE FROM checkins WHERE data < ?").run(limite);
  banco.prepare("DELETE FROM participacoes WHERE data < ?").run(limite);
  // Aproveita para apagar logins vencidos
  banco.prepare("DELETE FROM sessoes WHERE expira_em < ?").run(Date.now());
  return Number(changes);
}

module.exports = { prazoEmDias, apagarDadosAntigos, PRAZO_PADRAO };
