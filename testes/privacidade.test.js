// ===== Testes do aviso de privacidade =====

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { iniciarServidor } = require("./ajudante");
const { abrirBanco } = require("../servidor/banco");

let s;
beforeEach(async function () {
  s = await iniciarServidor();
});
afterEach(function () {
  s.encerrar();
});

test("o aviso aparece no primeiro uso e some depois de lido", async function () {
  await s.cadastrar("ana@teste.com");
  const sessao = await s.entrar("ana@teste.com");

  let eu = await s.requisitar("GET", "/api/eu", undefined, sessao);
  assert.equal(eu.corpo.avisoPrivacidadeVisto, false);

  const r = await s.requisitar("POST", "/api/aviso-privacidade", undefined, sessao);
  assert.equal(r.status, 200);

  eu = await s.requisitar("GET", "/api/eu", undefined, sessao);
  assert.equal(eu.corpo.avisoPrivacidadeVisto, true);
});

test("só funcionários logados registram a leitura do aviso", async function () {
  assert.equal((await s.requisitar("POST", "/api/aviso-privacidade")).status, 401);
  await s.cadastrar("gestor@teste.com", "gestor");
  const sessaoGestor = await s.entrar("gestor@teste.com");
  assert.equal((await s.requisitar("POST", "/api/aviso-privacidade", undefined, sessaoGestor)).status, 403);
});

test("a página do aviso completo abre sem login", async function () {
  const r = await s.requisitar("GET", "/privacidade.html");
  assert.equal(r.status, 200);
  assert.match(r.texto, /Como cuidamos dos seus dados/);
});

test("bancos criados antes do aviso ganham a coluna nova", function () {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "bem-estar-"));
  const arquivo = path.join(pasta, "antigo.db");
  // Banco "antigo", sem a coluna aviso_visto_em
  const antigo = new DatabaseSync(arquivo);
  antigo.exec(`CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL, tipo TEXT NOT NULL, equipe_id INTEGER NOT NULL)`);
  antigo.close();

  const banco = abrirBanco(arquivo);
  const colunas = banco.prepare("PRAGMA table_info(usuarios)").all().map((c) => c.name);
  banco.close();
  fs.rmSync(pasta, { recursive: true, force: true });
  assert.ok(colunas.includes("aviso_visto_em"));
});
