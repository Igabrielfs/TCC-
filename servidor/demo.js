// ===== Dados de demonstração =====
// Cria duas equipes de exemplo com check-ins das últimas semanas, para testar
// o painel do gestor sem precisar esperar respostas de verdade.
//   npm run demo
// ATENÇÃO: use só no banco de testes, nunca no banco com dados reais.
// A senha dos usuários de demonstração é sorteada e mostrada uma única vez.

const path = require("node:path");
const crypto = require("node:crypto");
const { abrirBanco } = require("./banco");
const { criarUsuario } = require("./usuarios");
const { hoje, somarDias, segundaDaSemana } = require("./datas");

const SEMANAS = 10;

// Número inteiro aleatório entre min e max (incluindo os dois)
function sortear(min, max) {
  return min + crypto.randomInt(max - min + 1);
}

async function criarEquipe(banco, senha, nomeEquipe, prefixo, quantidade) {
  await criarUsuario(banco, {
    nome: "Gestor(a) " + nomeEquipe,
    email: "gestor." + prefixo + "@example.com",
    tipo: "gestor",
    equipe: nomeEquipe,
    senha: senha,
  });
  const ids = [];
  for (let i = 1; i <= quantidade; i++) {
    const r = await criarUsuario(banco, {
      nome: "Pessoa " + i + " (" + nomeEquipe + ")",
      email: "pessoa" + i + "." + prefixo + "@example.com",
      tipo: "funcionario",
      equipe: nomeEquipe,
      senha: senha,
    });
    ids.push(r.id);
  }
  return ids;
}

// Gera check-ins nos dias úteis das últimas semanas (sem o dia de hoje)
function gerarCheckins(banco, ids, equipeId, { semanaFraca } = {}) {
  const inserirParticipacao = banco.prepare("INSERT INTO participacoes (usuario_id, data) VALUES (?, ?)");
  const inserirCheckin = banco.prepare(
    "INSERT INTO checkins (id, equipe_id, data, humor, comentario) VALUES (?, ?, ?, ?, NULL)"
  );
  const inicio = somarDias(segundaDaSemana(hoje()), -7 * SEMANAS);

  for (let semana = 0; semana < SEMANAS; semana++) {
    // O humor médio da equipe sobe e desce um pouco ao longo das semanas
    const humorBase = 3 + Math.sin(semana / 2);
    // Numa das semanas, quase ninguém responde (para mostrar "Dados insuficientes")
    const quemResponde = semana === semanaFraca ? ids.slice(0, 3) : ids;

    for (let dia = 0; dia < 5; dia++) {
      const data = somarDias(inicio, semana * 7 + dia);
      if (data >= hoje()) {
        continue;
      }
      quemResponde.forEach(function (id) {
        if (sortear(1, 100) > 75) {
          return; // nem todo mundo responde todo dia
        }
        const humor = Math.min(5, Math.max(1, Math.round(humorBase + sortear(-1, 1))));
        inserirParticipacao.run(id, data);
        inserirCheckin.run(crypto.randomUUID(), equipeId, data, humor);
      });
    }
  }
}

async function principal() {
  const arquivo = process.env.ARQUIVO_BANCO || path.join(__dirname, "dados", "bem-estar.db");
  const banco = abrirBanco(arquivo);

  if (banco.prepare("SELECT 1 FROM usuarios WHERE email LIKE '%@example.com'").get()) {
    console.error("Os dados de demonstração já existem neste banco.");
    console.error("Para recomeçar, apague o arquivo " + arquivo + " e rode de novo.");
    process.exit(1);
  }

  const senha = crypto.randomBytes(9).toString("base64url");

  const idsGrande = await criarEquipe(banco, senha, "Agência Demonstração", "demo", 8);
  const idsPequena = await criarEquipe(banco, senha, "Equipe Pequena", "pequena", 3);

  const equipeDe = (id) => banco.prepare("SELECT equipe_id FROM usuarios WHERE id = ?").get(id).equipe_id;
  banco.exec("BEGIN");
  gerarCheckins(banco, idsGrande, equipeDe(idsGrande[0]), { semanaFraca: SEMANAS - 4 });
  gerarCheckins(banco, idsPequena, equipeDe(idsPequena[0]));
  banco.exec("COMMIT");
  banco.close();

  console.log("Dados de demonstração criados!\n");
  console.log("Senha de TODOS os usuários de demonstração: " + senha);
  console.log("(anote: ela não será mostrada de novo)\n");
  console.log("Gestor com dados:          gestor.demo@example.com");
  console.log("Gestor de equipe pequena:  gestor.pequena@example.com  (mostra 'Dados insuficientes')");
  console.log("Funcionários:              pessoa1.demo@example.com ... pessoa8.demo@example.com");
}

principal();
