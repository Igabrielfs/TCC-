// ===== Aplicação web (rotas do servidor) =====

const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const helmet = require("helmet");
const { validarCheckin } = require("./validacao");
const { hoje } = require("./datas");

const PASTA_PUBLICA = path.join(__dirname, "..", "public");

function criarApp({ banco }) {
  const app = express();

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

  // Entrega os arquivos da pasta public/ (HTML, CSS e JavaScript)
  app.use(express.static(PASTA_PUBLICA));

  // ----- Registrar um check-in -----
  app.post("/api/checkins", function (req, res) {
    const resultado = validarCheckin(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ erro: resultado.erro });
    }

    // Consulta parametrizada (os "?"): regra 3 do SEGURANCA.md
    banco
      .prepare("INSERT INTO checkins (id, equipe_id, data, humor, comentario) VALUES (?, ?, ?, ?, ?)")
      .run(crypto.randomUUID(), null, hoje(), resultado.valor.humor, resultado.valor.comentario);

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
