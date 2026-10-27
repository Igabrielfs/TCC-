// ===== Cadastro de usuários =====

const bcrypt = require("bcryptjs");
const { validarNovoUsuario } = require("./validacao");

// "Custo" do bcrypt: quanto maior, mais lento (de propósito) para dificultar
// ataques de força bruta. 12 leva uma fração de segundo num computador comum.
const CUSTO_BCRYPT = 12;

// Cria a equipe se ela ainda não existir e devolve o id dela
function idDaEquipe(banco, nome) {
  banco.prepare("INSERT OR IGNORE INTO equipes (nome) VALUES (?)").run(nome);
  return banco.prepare("SELECT id FROM equipes WHERE nome = ?").get(nome).id;
}

// Cadastra um usuário. Devolve { ok: true, id } ou { ok: false, erro }.
async function criarUsuario(banco, dados, custo = CUSTO_BCRYPT) {
  const resultado = validarNovoUsuario(dados);
  if (!resultado.ok) {
    return resultado;
  }
  const { nome, email, tipo, equipe, senha } = resultado.valor;

  const existente = banco.prepare("SELECT id FROM usuarios WHERE email = ?").get(email);
  if (existente) {
    return { ok: false, erro: "Já existe um usuário com esse e-mail." };
  }

  const senhaHash = await bcrypt.hash(senha, custo);
  const equipeId = idDaEquipe(banco, equipe);
  const info = banco
    .prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo, equipe_id) VALUES (?, ?, ?, ?, ?)")
    .run(nome, email, senhaHash, tipo, equipeId);

  return { ok: true, id: Number(info.lastInsertRowid) };
}

module.exports = { criarUsuario, idDaEquipe, CUSTO_BCRYPT };
