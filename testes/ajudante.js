// ===== Funções de apoio para os testes =====
// Sobe o servidor numa porta livre, com um banco temporário (em memória),
// para cada teste começar do zero sem mexer no banco de verdade.

const assert = require("node:assert/strict");
const { abrirBanco } = require("../servidor/banco");
const { criarApp } = require("../servidor/app");
const { criarUsuario } = require("../servidor/usuarios");

// Senha usada só nos testes automáticos, com um banco temporário que some no fim
const SENHA_TESTE = "senha-de-teste-123";

async function iniciarServidor() {
  const banco = abrirBanco(":memory:");
  const app = criarApp({ banco });

  const servidor = await new Promise(function (resolver) {
    const s = app.listen(0, "127.0.0.1", function () {
      resolver(s);
    });
  });
  const endereco = "http://127.0.0.1:" + servidor.address().port;

  // Faz uma requisição JSON e devolve { status, corpo }
  async function requisitar(metodo, caminho, corpo, cabecalhos = {}) {
    const resposta = await fetch(endereco + caminho, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...cabecalhos },
      body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    });
    const texto = await resposta.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {
      // resposta não é JSON (ex.: uma página HTML)
    }
    return { status: resposta.status, corpo: json, texto: texto, cabecalhos: resposta.headers };
  }

  // Cadastra um usuário de teste (custo do bcrypt baixo, só para o teste ser rápido)
  async function cadastrar(email, tipo = "funcionario", equipe = "Equipe Teste") {
    const r = await criarUsuario(banco, { nome: "Pessoa " + email, email, tipo, equipe, senha: SENHA_TESTE }, 4);
    assert.ok(r.ok, r.erro);
    return r.id;
  }

  // Faz login e devolve o cookie da sessão, para usar nas próximas requisições
  async function entrar(email) {
    const r = await requisitar("POST", "/api/login", { email: email, senha: SENHA_TESTE });
    assert.equal(r.status, 200);
    return { Cookie: r.cabecalhos.get("set-cookie").split(";")[0] };
  }

  function encerrar() {
    servidor.close();
    banco.close();
  }

  return { banco, endereco, requisitar, cadastrar, entrar, encerrar };
}

module.exports = { iniciarServidor };
