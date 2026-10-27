// ===== Validação dos dados que chegam do navegador =====
// Regra 1 do SEGURANCA.md: nunca confie na entrada do usuário.
// Cada função devolve { ok: true, valor } ou { ok: false, erro }.

const LIMITE_COMENTARIO = 280;

// Confere se o corpo da requisição é um objeto e se só tem os campos permitidos
function camposPermitidos(corpo, permitidos) {
  if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
    return false;
  }
  return Object.keys(corpo).every(function (campo) {
    return permitidos.includes(campo);
  });
}

function validarCheckin(corpo) {
  if (!camposPermitidos(corpo, ["humor", "comentario"])) {
    return { ok: false, erro: "Dados inválidos." };
  }

  // Humor: obrigatório, número inteiro de 1 a 5
  const humor = corpo.humor;
  if (!Number.isInteger(humor) || humor < 1 || humor > 5) {
    return { ok: false, erro: "Escolha um emoji válido." };
  }

  // Comentário: opcional, texto de até 280 caracteres
  let comentario = corpo.comentario;
  if (comentario === undefined || comentario === null) {
    comentario = "";
  }
  if (typeof comentario !== "string") {
    return { ok: false, erro: "Comentário inválido." };
  }
  comentario = comentario.trim();
  // [...texto].length conta cada emoji como 1 caractere (igual ao SQLite).
  // O navegador conta alguns emojis como 2, então tudo que ele aceita o servidor também aceita.
  if ([...comentario].length > LIMITE_COMENTARIO) {
    return { ok: false, erro: "O comentário pode ter no máximo 280 caracteres." };
  }

  return {
    ok: true,
    valor: { humor: humor, comentario: comentario === "" ? null : comentario },
  };
}

// E-mail: formato simples "algo@algo.algo", sem espaços, até 254 caracteres
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarEmail(email) {
  if (typeof email !== "string") {
    return null;
  }
  const limpo = email.trim().toLowerCase();
  if (limpo.length === 0 || limpo.length > 254 || !FORMATO_EMAIL.test(limpo)) {
    return null;
  }
  return limpo;
}

function validarLogin(corpo) {
  if (!camposPermitidos(corpo, ["email", "senha"])) {
    return { ok: false };
  }
  const email = validarEmail(corpo.email);
  const senha = corpo.senha;
  // O bcrypt só usa os primeiros 72 bytes da senha; acima disso, recusamos
  if (email === null || typeof senha !== "string" || senha.length === 0 || Buffer.byteLength(senha) > 72) {
    return { ok: false };
  }
  return { ok: true, valor: { email: email, senha: senha } };
}

const TIPOS_DE_USUARIO = ["funcionario", "gestor"];

function validarNovoUsuario(dados) {
  const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
  if (nome.length === 0 || nome.length > 100) {
    return { ok: false, erro: "O nome é obrigatório e pode ter no máximo 100 caracteres." };
  }
  const email = validarEmail(dados.email);
  if (email === null) {
    return { ok: false, erro: "E-mail inválido." };
  }
  if (!TIPOS_DE_USUARIO.includes(dados.tipo)) {
    return { ok: false, erro: 'O tipo deve ser "funcionario" ou "gestor".' };
  }
  const equipe = typeof dados.equipe === "string" ? dados.equipe.trim() : "";
  if (equipe.length === 0 || equipe.length > 100) {
    return { ok: false, erro: "A equipe é obrigatória e pode ter no máximo 100 caracteres." };
  }
  const senha = dados.senha;
  if (typeof senha !== "string" || senha.length < 8 || Buffer.byteLength(senha) > 72) {
    return { ok: false, erro: "A senha deve ter pelo menos 8 caracteres (e no máximo 72 bytes)." };
  }
  return { ok: true, valor: { nome: nome, email: email, tipo: dados.tipo, equipe: equipe, senha: senha } };
}

module.exports = {
  validarCheckin,
  validarLogin,
  validarNovoUsuario,
  camposPermitidos,
  LIMITE_COMENTARIO,
};
