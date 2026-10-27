// ===== Testes do prazo de guarda dos dados =====

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { abrirBanco } = require("../servidor/banco");
const { prazoEmDias, apagarDadosAntigos, PRAZO_PADRAO } = require("../servidor/retencao");

test("lê o prazo do .env e recusa valores inválidos", function () {
  assert.equal(prazoEmDias(undefined), PRAZO_PADRAO);
  assert.equal(prazoEmDias("90"), 90);
  for (const invalido of ["abc", "10", "99999", "30.5", "-1"]) {
    assert.throws(() => prazoEmDias(invalido));
  }
});

test("apaga só os check-ins e participações mais antigos que o prazo", function () {
  const banco = abrirBanco(":memory:");
  banco.exec("INSERT INTO equipes (id, nome) VALUES (1, 'E')");
  banco.exec("INSERT INTO usuarios (id, nome, email, senha_hash, tipo, equipe_id) VALUES (1, 'A', 'a@a.com', 'x', 'funcionario', 1)");
  const datas = ["2025-01-01", "2026-07-29", "2026-07-30", "2026-10-27"];
  datas.forEach(function (data, i) {
    banco.prepare("INSERT INTO checkins (id, equipe_id, data, humor) VALUES (?, 1, ?, 3)").run("id" + i, data);
    banco.prepare("INSERT INTO participacoes (usuario_id, data) VALUES (1, ?)").run(data);
  });
  banco.prepare("INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES ('velha', 1, ?)").run(Date.now() - 1000);
  banco.prepare("INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES ('nova', 1, ?)").run(Date.now() + 100000);

  // Prazo de 90 dias contado a partir de 27/10/2026: o limite é 29/07/2026
  const apagados = apagarDadosAntigos(banco, 90, "2026-10-27");

  assert.equal(apagados, 1);
  const restantes = banco.prepare("SELECT data FROM checkins ORDER BY data").all().map((l) => l.data);
  assert.deepEqual(restantes, ["2026-07-29", "2026-07-30", "2026-10-27"]);
  assert.equal(banco.prepare("SELECT COUNT(*) AS n FROM participacoes").get().n, 3);
  assert.deepEqual(banco.prepare("SELECT token_hash FROM sessoes").all().map((l) => l.token_hash), ["nova"]);
  banco.close();
});
