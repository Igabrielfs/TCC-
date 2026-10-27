// ===== Ponto de partida do servidor =====
// Para iniciar: npm start

const path = require("node:path");
const { abrirBanco } = require("./banco");
const { criarApp } = require("./app");
const { prazoEmDias, apagarDadosAntigos } = require("./retencao");

// Configurações vêm de variáveis de ambiente (arquivo .env), com valores padrão
const PORTA = Number(process.env.PORTA) || 3000;
const HOST = process.env.HOST || "localhost";
const ARQUIVO_BANCO = process.env.ARQUIVO_BANCO || path.join(__dirname, "dados", "bem-estar.db");
const RETENCAO_DIAS = prazoEmDias(process.env.RETENCAO_DIAS);

const banco = abrirBanco(ARQUIVO_BANCO);
const app = criarApp({ banco, producao: process.env.NODE_ENV === "production" });

// Apaga os dados que passaram do prazo agora e, depois, uma vez por dia
function limparDadosAntigos() {
  const apagados = apagarDadosAntigos(banco, RETENCAO_DIAS);
  console.log("Limpeza: " + apagados + " check-in(s) com mais de " + RETENCAO_DIAS + " dias apagado(s).");
}
limparDadosAntigos();
setInterval(limparDadosAntigos, 24 * 60 * 60 * 1000).unref();

app.listen(PORTA, HOST, function () {
  console.log("Servidor rodando em http://localhost:" + PORTA);
});
