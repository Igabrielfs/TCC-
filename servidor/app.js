// ===== Aplicação web (rotas do servidor) =====

const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const helmet = require("helmet");
const { validarCheckin, validarLogin } = require("./validacao");
const { hoje } = require("./datas");
const autenticacao = require("./autenticacao");

const PASTA_PUBLICA = path.join(__dirname, "..", "public");

// Página inicial de cada tipo de usuário
const PAGINA_INICIAL = {
  funcionario: "/",
  gestor: "/painel.html",
};

function criarApp({ banco, producao = false }) {
  const app = express();
  const limitadorDeLogin = autenticacao.criarLimitadorDeLogin();

  // Não conta para quem acessa qual tecnologia o servidor usa
  app.disable("x-powered-by");

  // Cabeçalhos de segurança (ex.: só permite scripts e estilos do próprio site)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "style-src": ["'self'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
        },
      },
    })
  );

  // Lê corpos em JSON de até 10 KB (um check-in tem bem menos que isso)
  app.use(express.json({ limit: "10kb" }));

  // Descobre quem está logado (se alguém estiver) em todas as requisições
  app.use(autenticacao.carregarUsuario(banco));

  // ----- Proteção das páginas -----
  // Cada página só abre para quem pode vê-la; os outros são levados para a página certa.
  function paginaPara(tipo) {
    return function (req, res, next) {
      if (!req.usuario) {
        return res.redirect("/login.html");
      }
      if (req.usuario.tipo !== tipo) {
        return res.redirect(PAGINA_INICIAL[req.usuario.tipo]);
      }
      next();
    };
  }

  app.get(["/", "/index.html"], paginaPara("funcionario"));
  app.get("/painel.html", paginaPara("gestor"));
  app.get("/login.html", function (req, res, next) {
    // Quem já está logado não precisa ver a tela de login
    if (req.usuario) {
      return res.redirect(PAGINA_INICIAL[req.usuario.tipo]);
    }
    next();
  });

  // Entrega os arquivos da pasta public/ (HTML, CSS e JavaScript)
  app.use(express.static(PASTA_PUBLICA));

  // ----- Login -----
  app.post("/api/login", async function (req, res) {
    const ip = req.ip;
    if (limitadorDeLogin.bloqueado(ip)) {
      return res.status(429).json({ erro: "Muitas tentativas. Aguarde alguns minutos e tente de novo." });
    }

    const resultado = validarLogin(req.body);
    const usuario = resultado.ok
      ? await autenticacao.conferirCredenciais(banco, resultado.valor.email, resultado.valor.senha)
      : null;

    if (!usuario) {
      limitadorDeLogin.registrarFalha(ip);
      // Mensagem genérica: não diz se o erro foi no e-mail ou na senha (regra 7)
      return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    limitadorDeLogin.limpar(ip);
    autenticacao.iniciarSessao(banco, res, usuario, producao);
    res.json({ tipo: usuario.tipo, destino: PAGINA_INICIAL[usuario.tipo] });
  });

  app.post("/api/logout", function (req, res) {
    autenticacao.encerrarSessao(banco, req, res, producao);
    res.json({ mensagem: "Até logo!" });
  });

  // Quem está logado (usado pelas páginas para mostrar o nome)
  app.get("/api/eu", function (req, res) {
    if (!req.usuario) {
      return res.status(401).json({ erro: "Faça login para continuar." });
    }
    res.json({ nome: req.usuario.nome, tipo: req.usuario.tipo });
  });

  // ----- Check-in -----
  const funcionario = autenticacao.exigirTipo("funcionario");

  // Diz se o funcionário logado já fez o check-in hoje
  app.get("/api/checkins/hoje", funcionario, function (req, res) {
    const registro = banco
      .prepare("SELECT 1 FROM participacoes WHERE usuario_id = ? AND data = ?")
      .get(req.usuario.id, hoje());
    res.json({ feito: Boolean(registro) });
  });

  app.post("/api/checkins", funcionario, function (req, res) {
    const resultado = validarCheckin(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ erro: resultado.erro });
    }

    const data = hoje();

    // As duas gravações acontecem juntas (transação): ou grava tudo, ou nada.
    // Consultas parametrizadas (os "?"): regra 3 do SEGURANCA.md
    banco.exec("BEGIN");
    try {
      const jaFez = banco
        .prepare("SELECT 1 FROM participacoes WHERE usuario_id = ? AND data = ?")
        .get(req.usuario.id, data);
      if (jaFez) {
        banco.exec("ROLLBACK");
        return res.status(409).json({ erro: "Você já fez o check-in hoje." });
      }

      // 1) registra QUE a pessoa respondeu hoje
      banco.prepare("INSERT INTO participacoes (usuario_id, data) VALUES (?, ?)").run(req.usuario.id, data);
      // 2) guarda O QUE foi respondido, sem dizer quem respondeu
      banco
        .prepare("INSERT INTO checkins (id, equipe_id, data, humor, comentario) VALUES (?, ?, ?, ?, ?)")
        .run(crypto.randomUUID(), req.usuario.equipe_id, data, resultado.valor.humor, resultado.valor.comentario);

      banco.exec("COMMIT");
    } catch (erro) {
      banco.exec("ROLLBACK");
      throw erro;
    }

    res.status(201).json({ mensagem: "Check-in registrado." });
  });

  // Qualquer outro endereço da API que não existe
  app.use("/api", function (req, res) {
    res.status(404).json({ erro: "Não encontrado." });
  });

  // Tratamento de erros: detalhes só no log, mensagem simples para o usuário (regra 7)
  app.use(function (erro, req, res, next) {
    // Erros do express.json (JSON mal formado, corpo grande demais) já vêm com status 4xx
    if (erro.status >= 400 && erro.status < 500) {
      return res.status(erro.status).json({ erro: "Dados inválidos." });
    }
    console.error(erro);
    res.status(500).json({ erro: "Algo deu errado. Tente novamente mais tarde." });
  });

  return app;
}

module.exports = { criarApp };
