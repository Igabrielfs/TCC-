// ===== Banco de dados SQLite =====
// Usamos o SQLite que já vem dentro do Node.js (módulo "node:sqlite"),
// então não é preciso instalar nada a mais.

const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");

// Abre (ou cria) o arquivo do banco. ":memory:" cria um banco temporário, usado nos testes.
function abrirBanco(arquivo) {
  if (arquivo !== ":memory:") {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  }
  const banco = new DatabaseSync(arquivo);

  // Faz o SQLite respeitar as ligações entre tabelas (chaves estrangeiras)
  banco.exec("PRAGMA foreign_keys = ON");

  criarTabelas(banco);
  return banco;
}

function criarTabelas(banco) {
  // Respostas de humor.
  // De propósito, esta tabela NÃO guarda quem respondeu: assim a resposta
  // é anônima até para quem tem acesso ao banco.
  // O "id" é um texto aleatório e a tabela é "WITHOUT ROWID" para que a
  // ordem em que as linhas foram gravadas não revele quem respondeu.
  banco.exec(`
    CREATE TABLE IF NOT EXISTS checkins (
      id         TEXT PRIMARY KEY,
      equipe_id  INTEGER,
      data       TEXT NOT NULL,
      humor      INTEGER NOT NULL CHECK (humor BETWEEN 1 AND 5),
      comentario TEXT CHECK (comentario IS NULL OR length(comentario) <= 280)
    ) WITHOUT ROWID
  `);
}

module.exports = { abrirBanco };
