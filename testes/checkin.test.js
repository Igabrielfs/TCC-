// ===== Testes do envio de check-in =====
// Para rodar: npm test

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { iniciarServidor } = require("./ajudante");

let s;
beforeEach(async function () {
  s = await iniciarServidor();
});
afterEach(function () {
  s.encerrar();
});

test("aceita um check-in válido e guarda no banco", async function () {
  const r = await s.requisitar("POST", "/api/checkins", { humor: 4, comentario: "  Dia bom  " });
  assert.equal(r.status, 201);

  const linhas = s.banco.prepare("SELECT humor, comentario, data FROM checkins").all();
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].humor, 4);
  assert.equal(linhas[0].comentario, "Dia bom");
  assert.match(linhas[0].data, /^\d{4}-\d{2}-\d{2}$/);
});

test("comentário é opcional", async function () {
  const r = await s.requisitar("POST", "/api/checkins", { humor: 3 });
  assert.equal(r.status, 201);
  assert.equal(s.banco.prepare("SELECT comentario FROM checkins").get().comentario, null);
});

test("recusa humor fora da faixa ou de tipo errado", async function () {
  for (const humor of [0, 6, 2.5, "3", null, -1]) {
    const r = await s.requisitar("POST", "/api/checkins", { humor: humor });
    assert.equal(r.status, 400, "humor " + JSON.stringify(humor) + " deveria ser recusado");
  }
  const r = await s.requisitar("POST", "/api/checkins", { comentario: "sem humor" });
  assert.equal(r.status, 400);
  assert.equal(s.banco.prepare("SELECT COUNT(*) AS n FROM checkins").get().n, 0);
});

test("recusa comentário grande demais ou de tipo errado", async function () {
  let r = await s.requisitar("POST", "/api/checkins", { humor: 3, comentario: "a".repeat(281) });
  assert.equal(r.status, 400);
  r = await s.requisitar("POST", "/api/checkins", { humor: 3, comentario: { texto: "oi" } });
  assert.equal(r.status, 400);
  r = await s.requisitar("POST", "/api/checkins", { humor: 3, comentario: "a".repeat(280) });
  assert.equal(r.status, 201);
});

test("recusa campos que não estão na lista de permitidos", async function () {
  const r = await s.requisitar("POST", "/api/checkins", { humor: 3, data: "2020-01-01" });
  assert.equal(r.status, 400);
});

test("JSON mal formado recebe erro genérico, sem detalhes técnicos", async function () {
  const r = await s.requisitar("POST", "/api/checkins", "{humor: ");
  assert.equal(r.status, 400);
  assert.deepEqual(r.corpo, { erro: "Dados inválidos." });
});

test("texto com HTML é guardado como texto, sem executar nada", async function () {
  const ataque = "<script>alert(1)</script>'); DROP TABLE checkins; --";
  const r = await s.requisitar("POST", "/api/checkins", { humor: 2, comentario: ataque });
  assert.equal(r.status, 201);
  assert.equal(s.banco.prepare("SELECT comentario FROM checkins").get().comentario, ataque);
});

test("entrega as páginas e envia cabeçalhos de segurança", async function () {
  const r = await s.requisitar("GET", "/");
  assert.equal(r.status, 200);
  assert.match(r.texto, /Como você está hoje\?/);
  assert.ok(r.cabecalhos.get("content-security-policy"));
  assert.equal(r.cabecalhos.get("x-powered-by"), null);
});
