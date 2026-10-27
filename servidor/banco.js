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
  atualizarTabelas(banco);
  return banco;
}

// Acrescenta colunas novas em bancos criados por versões anteriores do sistema
function atualizarTabelas(banco) {
  const colunas = banco.prepare("PRAGMA table_info(usuarios)").all().map((c) => c.name);
  if (!colunas.includes("aviso_visto_em")) {
    // Data em que o funcionário leu o aviso de privacidade (vazio = ainda não leu)
    banco.exec("ALTER TABLE usuarios ADD COLUMN aviso_visto_em TEXT");
  }
}

function criarTabelas(banco) {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS equipes (
      id   INTEGER PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE
    )
  `);

  // O gestor também pertence a uma equipe: é a equipe que ele acompanha no painel.
  // A senha nunca é guardada, só o "hash" dela (regra 6 do SEGURANCA.md).
  banco.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INTEGER PRIMARY KEY,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      tipo       TEXT NOT NULL CHECK (tipo IN ('funcionario', 'gestor')),
      equipe_id  INTEGER NOT NULL REFERENCES equipes (id)
    )
  `);

  // Sessões de login. Guardamos só o hash do código da sessão: se o banco
  // vazar, ninguém consegue usar esses códigos para entrar no sistema.
  banco.exec(`
    CREATE TABLE IF NOT EXISTS sessoes (
      token_hash TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
      expira_em  INTEGER NOT NULL
    )
  `);

  // Quem já fez o check-in em cada dia. Serve para impedir dois check-ins
  // no mesmo dia e para calcular a participação, sem dizer O QUE a pessoa respondeu.
  banco.exec(`
    CREATE TABLE IF NOT EXISTS participacoes (
      usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
      data       TEXT NOT NULL,
      PRIMARY KEY (usuario_id, data)
    )
  `);

  // Respostas de humor.
  // De propósito, esta tabela NÃO guarda quem respondeu: assim a resposta
  // é anônima até para quem tem acesso ao banco.
  // O "id" é um texto aleatório e a tabela é "WITHOUT ROWID" para que a
  // ordem em que as linhas foram gravadas não revele quem respondeu.
  banco.exec(`
    CREATE TABLE IF NOT EXISTS checkins (
      id         TEXT PRIMARY KEY,
      equipe_id  INTEGER REFERENCES equipes (id),
      data       TEXT NOT NULL,
      humor      INTEGER NOT NULL CHECK (humor BETWEEN 1 AND 5),
      comentario TEXT CHECK (comentario IS NULL OR length(comentario) <= 280)
    ) WITHOUT ROWID
  `);
}

module.exports = { abrirBanco };
