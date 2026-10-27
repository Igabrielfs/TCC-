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

module.exports = { validarCheckin, camposPermitidos, LIMITE_COMENTARIO };
