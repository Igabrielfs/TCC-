// ===== Testes de cadastro, login e sessões =====

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { iniciarServidor } = require("./ajudante");
const { criarUsuario } = require("../servidor/usuarios");

let s;
beforeEach(async function () {
  s = await iniciarServidor();
});
afterEach(function () {
  s.encerrar();
});

test("a senha é guardada com hash bcrypt, nunca em texto puro", async function () {
  await s.cadastrar("ana@teste.com");
  const { senha_hash } = s.banco.prepare("SELECT senha_hash FROM usuarios").get();
  assert.match(senha_hash, /^\$2[aby]\$/);
  assert.ok(!senha_hash.includes("senha-de-teste-123"));
});

test("cadastro valida os dados e não aceita e-mail repetido", async function () {
  const base = { nome: "Ana", email: "ana@teste.com", tipo: "funcionario", equipe: "Equipe A", senha: "12345678" };
  assert.equal((await criarUsuario(s.banco, base, 4)).ok, true);
  assert.equal((await criarUsuario(s.banco, { ...base, email: "ANA@teste.com" }, 4)).ok, false);
  assert.equal((await criarUsuario(s.banco, { ...base, email: "b@t.com", senha: "curta" }, 4)).ok, false);
  assert.equal((await criarUsuario(s.banco, { ...base, email: "c@t.com", tipo: "admin" }, 4)).ok, false);
  assert.equal((await criarUsuario(s.banco, { ...base, email: "sem-arroba" }, 4)).ok, false);
  assert.equal((await criarUsuario(s.banco, { ...base, email: "d@t.com", nome: "x".repeat(101) }, 4)).ok, false);
});

test("login certo leva cada tipo de usuário para a sua tela", async function () {
  await s.cadastrar("func@teste.com", "funcionario");
  await s.cadastrar("gestor@teste.com", "gestor");

  let r = await s.requisitar("POST", "/api/login", { email: "FUNC@teste.com ", senha: "senha-de-teste-123" });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.destino, "/");

  r = await s.requisitar("POST", "/api/login", { email: "gestor@teste.com", senha: "senha-de-teste-123" });
  assert.equal(r.corpo.destino, "/painel.html");
});

test("o cookie de sessão é protegido e dura mais para o funcionário", async function () {
  await s.cadastrar("func@teste.com", "funcionario");
  await s.cadastrar("gestor@teste.com", "gestor");

  const cookieFunc = (await s.requisitar("POST", "/api/login", { email: "func@teste.com", senha: "senha-de-teste-123" }))
    .cabecalhos.get("set-cookie");
  assert.match(cookieFunc, /HttpOnly/);
  assert.match(cookieFunc, /SameSite=Strict/);
  assert.match(cookieFunc, /Max-Age=2592000/); // 30 dias

  const cookieGestor = (await s.requisitar("POST", "/api/login", { email: "gestor@teste.com", senha: "senha-de-teste-123" }))
    .cabecalhos.get("set-cookie");
  assert.match(cookieGestor, /Max-Age=28800/); // 8 horas
});

test("o banco guarda só o hash do token da sessão", async function () {
  await s.cadastrar("func@teste.com");
  const sessao = await s.entrar("func@teste.com");
  const token = sessao.Cookie.split("=")[1];
  const { token_hash } = s.banco.prepare("SELECT token_hash FROM sessoes").get();
  assert.notEqual(token_hash, token);
});

test("login errado dá mensagem genérica, igual para e-mail ou senha errados", async function () {
  await s.cadastrar("func@teste.com");
  const senhaErrada = await s.requisitar("POST", "/api/login", { email: "func@teste.com", senha: "errada123" });
  const emailErrado = await s.requisitar("POST", "/api/login", { email: "ninguem@teste.com", senha: "errada123" });
  assert.equal(senhaErrada.status, 401);
  assert.deepEqual(senhaErrada.corpo, emailErrado.corpo);
  assert.deepEqual(senhaErrada.corpo, { erro: "E-mail ou senha inválidos." });
});

test("bloqueia depois de muitas tentativas erradas", async function () {
  await s.cadastrar("func@teste.com");
  for (let i = 0; i < 5; i++) {
    await s.requisitar("POST", "/api/login", { email: "func@teste.com", senha: "errada123" });
  }
  const r = await s.requisitar("POST", "/api/login", { email: "func@teste.com", senha: "senha-de-teste-123" });
  assert.equal(r.status, 429);
});

test("login com dados malformados é recusado", async function () {
  for (const corpo of [{}, { email: 1, senha: 2 }, { email: "a@b.c", senha: "x".repeat(73) }, { email: "a@b.c", senha: "x", extra: 1 }]) {
    const r = await s.requisitar("POST", "/api/login", corpo);
    assert.equal(r.status, 401);
  }
});

test("logout encerra a sessão", async function () {
  await s.cadastrar("func@teste.com");
  const sessao = await s.entrar("func@teste.com");
  assert.equal((await s.requisitar("GET", "/api/eu", undefined, sessao)).status, 200);
  await s.requisitar("POST", "/api/logout", undefined, sessao);
  assert.equal((await s.requisitar("GET", "/api/eu", undefined, sessao)).status, 401);
});

test("as páginas levam cada pessoa para o lugar certo", async function () {
  await s.cadastrar("func@teste.com", "funcionario");
  await s.cadastrar("gestor@teste.com", "gestor");
  const func = await s.entrar("func@teste.com");
  const gestor = await s.entrar("gestor@teste.com");

  async function destino(caminho, cabecalhos) {
    const r = await fetch(s.endereco + caminho, { headers: cabecalhos, redirect: "manual" });
    return r.status === 200 ? "abre" : r.headers.get("location");
  }

  // Sem login
  assert.equal(await destino("/", {}), "/login.html");
  assert.equal(await destino("/painel.html", {}), "/login.html");
  assert.equal(await destino("/PAINEL.HTML", {}), "/login.html");
  assert.equal(await destino("/login.html", {}), "abre");
  assert.equal(await destino("/ajuda.html", {}), "abre");
  // Funcionário
  assert.equal(await destino("/", func), "abre");
  assert.equal(await destino("/painel.html", func), "/");
  assert.equal(await destino("/login.html", func), "/");
  // Gestor
  assert.equal(await destino("/painel.html", gestor), "abre");
  assert.equal(await destino("/", gestor), "/painel.html");
  assert.equal(await destino("/index.html", gestor), "/painel.html");
});
