// ===== Login e sessões =====
// Depois do login, o navegador recebe um "cookie" com um código secreto e
// aleatório (o token da sessão). A cada requisição, o navegador devolve esse
// cookie e o servidor descobre quem é a pessoa.

const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const NOME_COOKIE = "sessao";
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

// Quanto tempo o login fica salvo. O funcionário fica conectado por 30 dias
// para não digitar a senha todo dia; o gestor, que vê dados da equipe, por 8 horas.
const DURACAO_SESSAO = {
  funcionario: 30 * DIA,
  gestor: 8 * HORA,
};

// Hash usado quando o e-mail não existe, para o login demorar o mesmo tempo
// nos dois casos (assim ninguém descobre quais e-mails estão cadastrados).
const HASH_FALSO = bcrypt.hashSync("senha-que-nao-existe", 12);

function hashDoToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Lê os cookies do cabeçalho "Cookie: a=1; b=2"
function lerCookies(req) {
  const cookies = {};
  const cabecalho = req.headers.cookie || "";
  cabecalho.split(";").forEach(function (parte) {
    const posicao = parte.indexOf("=");
    if (posicao > 0) {
      cookies[parte.slice(0, posicao).trim()] = parte.slice(posicao + 1).trim();
    }
  });
  return cookies;
}

function opcoesDoCookie(producao, duracao) {
  return {
    httpOnly: true, // o JavaScript da página não consegue ler o cookie (protege contra XSS)
    sameSite: "strict", // o cookie não é enviado por outros sites (protege contra CSRF)
    secure: producao, // em produção, só envia o cookie por HTTPS
    path: "/",
    maxAge: duracao,
  };
}

// Confere e-mail e senha. Devolve o usuário ou null.
async function conferirCredenciais(banco, email, senha) {
  const usuario = banco
    .prepare("SELECT id, nome, tipo, equipe_id, senha_hash FROM usuarios WHERE email = ?")
    .get(email);
  const senhaCerta = await bcrypt.compare(senha, usuario ? usuario.senha_hash : HASH_FALSO);
  return usuario && senhaCerta ? usuario : null;
}

function iniciarSessao(banco, res, usuario, producao) {
  // Aproveita para apagar sessões vencidas
  banco.prepare("DELETE FROM sessoes WHERE expira_em < ?").run(Date.now());

  const token = crypto.randomBytes(32).toString("base64url");
  const duracao = DURACAO_SESSAO[usuario.tipo];
  banco
    .prepare("INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?, ?, ?)")
    .run(hashDoToken(token), usuario.id, Date.now() + duracao);
  res.cookie(NOME_COOKIE, token, opcoesDoCookie(producao, duracao));
}

function encerrarSessao(banco, req, res, producao) {
  const token = lerCookies(req)[NOME_COOKIE];
  if (token) {
    banco.prepare("DELETE FROM sessoes WHERE token_hash = ?").run(hashDoToken(token));
  }
  res.clearCookie(NOME_COOKIE, opcoesDoCookie(producao, undefined));
}

// Middleware: descobre quem está logado e coloca em req.usuario (ou null)
function carregarUsuario(banco) {
  return function (req, res, next) {
    req.usuario = null;
    const token = lerCookies(req)[NOME_COOKIE];
    if (token) {
      req.usuario =
        banco
          .prepare(
            `SELECT u.id, u.nome, u.tipo, u.equipe_id, u.aviso_visto_em
               FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
              WHERE s.token_hash = ? AND s.expira_em > ?`
          )
          .get(hashDoToken(token), Date.now()) || null;
    }
    next();
  };
}

// Middleware para rotas da API: só deixa passar quem for do tipo pedido
function exigirTipo(tipo) {
  return function (req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ erro: "Faça login para continuar." });
    }
    if (req.usuario.tipo !== tipo) {
      return res.status(403).json({ erro: "Acesso não permitido." });
    }
    next();
  };
}

// Limita tentativas de login erradas: no máximo 5 a cada 15 minutos por endereço (IP).
// Fica na memória do servidor, o que é suficiente para um único servidor.
function criarLimitadorDeLogin({ maximo = 5, janela = 15 * 60 * 1000 } = {}) {
  const falhas = new Map();

  function bloqueado(ip) {
    const registro = falhas.get(ip);
    if (!registro || Date.now() - registro.inicio > janela) {
      falhas.delete(ip);
      return false;
    }
    return registro.quantidade >= maximo;
  }

  function registrarFalha(ip) {
    // Evita que a lista cresça sem parar: de vez em quando, apaga os registros antigos
    if (falhas.size > 10000) {
      falhas.forEach(function (r, chave) {
        if (Date.now() - r.inicio > janela) {
          falhas.delete(chave);
        }
      });
    }
    const registro = falhas.get(ip);
    if (!registro || Date.now() - registro.inicio > janela) {
      falhas.set(ip, { inicio: Date.now(), quantidade: 1 });
    } else {
      registro.quantidade++;
    }
  }

  function limpar(ip) {
    falhas.delete(ip);
  }

  return { bloqueado, registrarFalha, limpar };
}

module.exports = {
  conferirCredenciais,
  iniciarSessao,
  encerrarSessao,
  carregarUsuario,
  exigirTipo,
  criarLimitadorDeLogin,
};
