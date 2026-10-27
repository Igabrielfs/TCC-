// ===== Cadastrar um usuário pelo terminal =====
// Exemplo:
//   npm run criar-usuario -- --nome "Ana Souza" --email ana@empresa.com --tipo funcionario --equipe "Agência Centro"
// A senha é pedida depois, sem aparecer na tela (assim ela não fica no histórico do terminal).

const path = require("node:path");
const readline = require("node:readline");
const { parseArgs } = require("node:util");
const { abrirBanco } = require("./banco");
const { criarUsuario } = require("./usuarios");

// Leitor do terminal. O que a pessoa digita não aparece na tela.
const leitor = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
leitor._writeToOutput = function () {};
const linhas = leitor[Symbol.asyncIterator]();

async function perguntarSenha(pergunta) {
  process.stdout.write(pergunta);
  const { value, done } = await linhas.next();
  process.stdout.write("\n");
  // Se a entrada acabar antes da resposta (ex.: Ctrl+C), encerra com erro
  if (done) {
    console.error("Cadastro cancelado.");
    process.exit(1);
  }
  return value;
}

async function principal() {
  const { values: opcoes } = parseArgs({
    options: {
      nome: { type: "string" },
      email: { type: "string" },
      tipo: { type: "string" },
      equipe: { type: "string" },
    },
  });

  const senha = await perguntarSenha("Senha (mínimo 8 caracteres): ");
  const confirmacao = await perguntarSenha("Repita a senha: ");
  leitor.close();
  if (senha !== confirmacao) {
    console.error("As senhas não são iguais.");
    process.exit(1);
  }

  const arquivo = process.env.ARQUIVO_BANCO || path.join(__dirname, "dados", "bem-estar.db");
  const banco = abrirBanco(arquivo);
  const resultado = await criarUsuario(banco, { ...opcoes, senha: senha });
  banco.close();

  if (!resultado.ok) {
    console.error("Não foi possível cadastrar: " + resultado.erro);
    process.exit(1);
  }
  console.log("Usuário cadastrado com sucesso.");
}

principal();
