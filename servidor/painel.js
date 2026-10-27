// ===== Indicadores do painel do gestor =====
// Regras de privacidade:
// - O servidor calcula as médias e devolve SÓ os números da equipe.
//   Nenhuma resposta individual (nem comentário) sai daqui.
// - Uma média só é mostrada se pelo menos MINIMO_PESSOAS pessoas diferentes
//   responderam no período; senão, vai "null" ("Dados insuficientes" na tela).
// - Usamos só períodos JÁ ENCERRADOS (semana e mês completos). Se o período
//   ainda estivesse em andamento, o gestor poderia comparar a média de ontem
//   com a de hoje e descobrir a resposta de quem respondeu no meio do caminho.

const { ultimaSemanaCompleta, ultimoMesCompleto, somarDias } = require("./datas");

const MINIMO_PESSOAS = 5;
const SEMANAS_NO_GRAFICO = 8;

function tamanhoDaEquipe(banco, equipeId) {
  return banco
    .prepare("SELECT COUNT(*) AS total FROM usuarios WHERE equipe_id = ? AND tipo = 'funcionario'")
    .get(equipeId).total;
}

// Calcula os números de um período (de "inicio" até "fim", incluindo os dois dias)
function resumoDoPeriodo(banco, equipeId, totalEquipe, inicio, fim) {
  // Quantas pessoas diferentes responderam pelo menos uma vez no período
  const { pessoas } = banco
    .prepare(
      `SELECT COUNT(DISTINCT p.usuario_id) AS pessoas
         FROM participacoes p JOIN usuarios u ON u.id = p.usuario_id
        WHERE u.equipe_id = ? AND p.data BETWEEN ? AND ?`
    )
    .get(equipeId, inicio, fim);

  // Média do humor no período (a tabela checkins não sabe quem respondeu)
  const { media } = banco
    .prepare("SELECT AVG(humor) AS media FROM checkins WHERE equipe_id = ? AND data BETWEEN ? AND ?")
    .get(equipeId, inicio, fim);

  const suficiente = pessoas >= MINIMO_PESSOAS && media !== null;
  return {
    inicio: inicio,
    fim: fim,
    // Arredonda para 1 casa decimal (ex.: 3.8)
    media: suficiente ? Math.round(media * 10) / 10 : null,
    participacao: totalEquipe > 0 ? Math.round((pessoas / totalEquipe) * 100) : 0,
  };
}

function indicadoresDaEquipe(banco, equipeId, dataDeHoje) {
  const equipe = banco.prepare("SELECT nome FROM equipes WHERE id = ?").get(equipeId);
  const totalEquipe = tamanhoDaEquipe(banco, equipeId);

  const semana = ultimaSemanaCompleta(dataDeHoje);
  const mes = ultimoMesCompleto(dataDeHoje);

  // Gráfico: média de cada uma das últimas semanas completas, da mais antiga para a mais nova
  const grafico = [];
  for (let i = SEMANAS_NO_GRAFICO - 1; i >= 0; i--) {
    const inicio = somarDias(semana.inicio, -7 * i);
    grafico.push(resumoDoPeriodo(banco, equipeId, totalEquipe, inicio, somarDias(inicio, 6)));
  }

  return {
    equipe: equipe ? equipe.nome : "",
    minimoPessoas: MINIMO_PESSOAS,
    totalEquipe: totalEquipe,
    semana: resumoDoPeriodo(banco, equipeId, totalEquipe, semana.inicio, semana.fim),
    mes: resumoDoPeriodo(banco, equipeId, totalEquipe, mes.inicio, mes.fim),
    grafico: grafico,
  };
}

module.exports = { indicadoresDaEquipe, MINIMO_PESSOAS };
