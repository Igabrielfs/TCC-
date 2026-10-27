// ===== Funções de apoio para os testes =====
// Sobe o servidor numa porta livre, com um banco temporário (em memória),
// para cada teste começar do zero sem mexer no banco de verdade.

const { abrirBanco } = require("../servidor/banco");
const { criarApp } = require("../servidor/app");

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

  function encerrar() {
    servidor.close();
    banco.close();
  }

  return { banco, endereco, requisitar, encerrar };
}

module.exports = { iniciarServidor };
