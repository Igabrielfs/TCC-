// ===== Ponto de partida do servidor =====
// Para iniciar: npm start

const path = require("node:path");
const { abrirBanco } = require("./banco");
const { criarApp } = require("./app");

// Configurações vêm de variáveis de ambiente (arquivo .env), com valores padrão
const PORTA = Number(process.env.PORTA) || 3000;
const HOST = process.env.HOST || "localhost";
const ARQUIVO_BANCO = process.env.ARQUIVO_BANCO || path.join(__dirname, "dados", "bem-estar.db");

const banco = abrirBanco(ARQUIVO_BANCO);
const app = criarApp({ banco });

app.listen(PORTA, HOST, function () {
  console.log("Servidor rodando em http://localhost:" + PORTA);
});
