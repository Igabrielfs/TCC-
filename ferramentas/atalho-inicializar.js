// ===== Abrir o check-in ao ligar o computador =====
// Cria um atalho na pasta "Inicializar" do Windows. Tudo o que está nessa pasta
// abre sozinho quando a pessoa entra no Windows; o atalho abre a plataforma no
// navegador padrão. Não precisa de permissão de administrador: vale só para o
// usuário que rodou o comando.
//
// Como usar:
//   npm run atalho -- --endereco https://bem-estar.empresa.com.br
//   npm run atalho -- --remover
// Sem --endereco, usa http://localhost:3000 (o servidor rodando neste computador).

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseArgs } = require("node:util");

const NOME_DO_ATALHO = "Check-in de bem-estar.url";

// Pasta "Inicializar" do usuário no Windows
function pastaInicializar() {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  return path.join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
}

// Aceita só endereços http:// ou https:// (lista de permitidos)
function validarEndereco(texto) {
  try {
    const url = new URL(texto);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function principal() {
  const { values: opcoes } = parseArgs({
    options: {
      endereco: { type: "string", default: "http://localhost:3000" },
      pasta: { type: "string", default: pastaInicializar() },
      remover: { type: "boolean", default: false },
    },
  });
  const caminho = path.join(opcoes.pasta, NOME_DO_ATALHO);

  if (opcoes.remover) {
    if (fs.existsSync(caminho)) {
      fs.unlinkSync(caminho);
      console.log("Atalho removido.");
    } else {
      console.log("Não havia atalho para remover.");
    }
    return;
  }

  const endereco = validarEndereco(opcoes.endereco);
  if (endereco === null) {
    console.error("Endereço inválido: use um endereço que comece com http:// ou https://");
    process.exit(1);
  }
  if (!fs.existsSync(opcoes.pasta)) {
    console.error("A pasta não existe: " + opcoes.pasta);
    process.exit(1);
  }

  // Um arquivo .url é um "atalho de internet": ao abrir, o Windows usa o navegador padrão
  fs.writeFileSync(caminho, "[InternetShortcut]\r\nURL=" + endereco + "\r\n", "ascii");
  console.log("Pronto! O check-in vai abrir sozinho na próxima vez que você entrar no Windows.");
  console.log("Atalho criado em: " + caminho);
}

principal();
