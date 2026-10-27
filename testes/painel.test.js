// ===== Testes do painel do gestor (médias e privacidade) =====

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { iniciarServidor } = require("./ajudante");
const { hoje, somarDias, ultimaSemanaCompleta, ultimoMesCompleto } = require("../servidor/datas");

let s;
let sessaoGestor;
let funcionarios; // ids dos funcionários da "Equipe Teste"
let equipeId;

beforeEach(async function () {
  s = await iniciarServidor();
  await s.cadastrar("gestor@teste.com", "gestor");
  funcionarios = [];
  for (let i = 1; i <= 6; i++) {
    funcionarios.push(await s.cadastrar("f" + i + "@teste.com"));
  }
  equipeId = s.banco.prepare("SELECT equipe_id FROM usuarios WHERE id = ?").get(funcionarios[0]).equipe_id;
  sessaoGestor = await s.entrar("gestor@teste.com");
});
afterEach(function () {
  s.encerrar();
});

// Grava uma resposta como o servidor faria, mas numa data escolhida
function responder(usuarioId, data, humor, comentario = null, equipe = equipeId) {
  s.banco.prepare("INSERT INTO participacoes (usuario_id, data) VALUES (?, ?)").run(usuarioId, data);
  s.banco
    .prepare("INSERT INTO checkins (id, equipe_id, data, humor, comentario) VALUES (?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), equipe, data, humor, comentario);
}

function painel(cabecalhos = sessaoGestor) {
  return s.requisitar("GET", "/api/painel", undefined, cabecalhos);
}

test("calcula as datas dos períodos encerrados", function () {
  // 2026-10-27 é uma terça-feira
  assert.deepEqual(ultimaSemanaCompleta("2026-10-27"), { inicio: "2026-10-19", fim: "2026-10-25" });
  assert.deepEqual(ultimaSemanaCompleta("2026-10-26"), { inicio: "2026-10-19", fim: "2026-10-25" });
  assert.deepEqual(ultimaSemanaCompleta("2026-10-25"), { inicio: "2026-10-12", fim: "2026-10-18" });
  assert.deepEqual(ultimoMesCompleto("2026-10-27"), { inicio: "2026-09-01", fim: "2026-09-30" });
  assert.deepEqual(ultimoMesCompleto("2026-03-01"), { inicio: "2026-02-01", fim: "2026-02-28" });
  assert.deepEqual(ultimoMesCompleto("2026-01-15"), { inicio: "2025-12-01", fim: "2025-12-31" });
});

test("mostra a média quando 5 ou mais pessoas responderam", async function () {
  const { inicio } = ultimaSemanaCompleta(hoje());
  const humores = [5, 4, 4, 3, 2];
  humores.forEach((h, i) => responder(funcionarios[i], inicio, h));

  const r = await painel();
  assert.equal(r.status, 200);
  assert.equal(r.corpo.semana.media, 3.6);
  assert.equal(r.corpo.semana.participacao, 83); // 5 de 6
  assert.equal(r.corpo.totalEquipe, 6);
  assert.equal(r.corpo.minimoPessoas, 5);
  assert.equal(r.corpo.grafico.length, 8);
  assert.equal(r.corpo.grafico[7].media, 3.6);
});

test("esconde a média com menos de 5 pessoas, mesmo com muitas respostas", async function () {
  const { inicio } = ultimaSemanaCompleta(hoje());
  // 4 pessoas respondendo todos os dias = 28 respostas, mas só 4 pessoas
  for (let dia = 0; dia < 7; dia++) {
    for (let i = 0; i < 4; i++) {
      responder(funcionarios[i], somarDias(inicio, dia), 2);
    }
  }
  const r = await painel();
  assert.equal(r.corpo.semana.media, null);
  assert.equal(r.corpo.grafico[7].media, null);
});

test("não usa o período em andamento (hoje não entra na média)", async function () {
  funcionarios.forEach((id) => responder(id, hoje(), 1));
  const r = await painel();
  assert.equal(r.corpo.semana.media, null);
  assert.ok(r.corpo.grafico.every((p) => p.fim < hoje()));
});

test("nunca envia comentários nem respostas individuais", async function () {
  const { inicio } = ultimaSemanaCompleta(hoje());
  funcionarios.forEach((id, i) => responder(id, inicio, (i % 5) + 1, "comentario-secreto-" + i));

  const r = await painel();
  assert.ok(!r.texto.includes("comentario-secreto"));
  assert.ok(!r.texto.includes("f1@teste.com"));
  // Só as chaves esperadas, todas agregadas
  assert.deepEqual(Object.keys(r.corpo).sort(), ["equipe", "grafico", "mes", "minimoPessoas", "semana", "totalEquipe"]);
  assert.deepEqual(Object.keys(r.corpo.semana).sort(), ["fim", "inicio", "media", "participacao"]);
});

test("o gestor vê só a própria equipe", async function () {
  const { inicio } = ultimaSemanaCompleta(hoje());
  // Outra equipe com 5 pessoas respondendo
  for (let i = 1; i <= 5; i++) {
    const id = await s.cadastrar("outra" + i + "@teste.com", "funcionario", "Outra Equipe");
    const outraEquipe = s.banco.prepare("SELECT equipe_id FROM usuarios WHERE id = ?").get(id).equipe_id;
    responder(id, inicio, 1, null, outraEquipe);
  }
  const r = await painel();
  assert.equal(r.corpo.equipe, "Equipe Teste");
  assert.equal(r.corpo.semana.media, null);
  assert.equal(r.corpo.semana.participacao, 0);
});

test("só gestores acessam o painel", async function () {
  assert.equal((await painel({})).status, 401);
  const sessaoFuncionario = await s.entrar("f1@teste.com");
  assert.equal((await painel(sessaoFuncionario)).status, 403);
});

test("entrega a biblioteca de gráficos pelo próprio servidor", async function () {
  const r = await s.requisitar("GET", "/vendor/chart.umd.min.js");
  assert.equal(r.status, 200);
  assert.match(r.cabecalhos.get("content-type"), /javascript/);
});
