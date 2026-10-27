// ===== Tela de check-in de humor =====

// Limite de caracteres do comentário (o mesmo do "maxlength" no HTML e do servidor)
const LIMITE_COMENTARIO = 280;

// Pega os elementos da página que vamos usar
const formulario = document.getElementById("form-checkin");
const opcoesHumor = document.querySelectorAll('input[name="humor"]');
const erroHumor = document.getElementById("erro-humor");
const erroEnvio = document.getElementById("erro-envio");
const campoComentario = document.getElementById("comentario");
const contador = document.getElementById("contador");
const botaoEnviar = formulario.querySelector('button[type="submit"]');
const agradecimento = document.getElementById("agradecimento");

// Destaca o emoji clicado: tira o destaque de todos e coloca só no escolhido
function destacarEmojiEscolhido() {
  opcoesHumor.forEach(function (opcao) {
    opcao.closest(".emoji").classList.toggle("selecionado", opcao.checked);
  });
  esconder(erroHumor);
}

function mostrarErro(elemento, texto) {
  // textContent (e não innerHTML) garante que o texto é mostrado como texto, nunca como código
  elemento.textContent = texto;
  elemento.hidden = false;
}

function esconder(elemento) {
  elemento.hidden = true;
}

// Atualiza o "X de 280 caracteres" enquanto a pessoa digita
function atualizarContador() {
  // Garante o limite mesmo se alguém mexer no "maxlength" pelo navegador
  if (campoComentario.value.length > LIMITE_COMENTARIO) {
    campoComentario.value = campoComentario.value.slice(0, LIMITE_COMENTARIO);
  }
  const usados = campoComentario.value.length;
  contador.textContent = usados + " de " + LIMITE_COMENTARIO + " caracteres";
  // Muda a cor quando está perto do limite
  contador.classList.toggle("perto-do-limite", usados >= LIMITE_COMENTARIO - 20);
}

// Devolve o valor do humor escolhido (1 a 5) ou null se nenhum foi escolhido
function humorEscolhido() {
  const escolhido = document.querySelector('input[name="humor"]:checked');
  if (!escolhido) {
    return null;
  }
  const valor = Number(escolhido.value);
  // Aceita só números inteiros de 1 a 5 (lista de permitidos)
  return Number.isInteger(valor) && valor >= 1 && valor <= 5 ? valor : null;
}

function mostrarAgradecimento() {
  formulario.hidden = true;
  agradecimento.hidden = false;
  // Leva o foco para a mensagem, para o leitor de tela anunciá-la
  agradecimento.querySelector("h2").focus();
}

// ===== Perguntar ao servidor se o check-in de hoje já foi feito =====
// Quem decide é o servidor, que sabe quem está logado. Assim funciona
// mesmo se várias pessoas usarem o mesmo computador.

// Se a sessão acabou, volta para a tela de login
function irParaLogin() {
  window.location.href = "/login.html";
}

async function conferirCheckinDeHoje() {
  try {
    const resposta = await fetch("/api/checkins/hoje");
    if (resposta.status === 401) {
      irParaLogin();
      return;
    }
    const dados = await resposta.json();
    if (dados.feito) {
      mostrarJaFeito();
    }
  } catch (erro) {
    // Sem conexão: deixa o formulário aberto; o servidor confere de novo no envio
  }
}

// Mostra o aviso de que o check-in de hoje já foi feito, no lugar do formulário
function mostrarJaFeito() {
  formulario.hidden = true;
  document.getElementById("ja-feito").hidden = false;
}

// ===== Aviso de privacidade (só no primeiro uso) =====

const avisoPrivacidade = document.getElementById("aviso-privacidade");
const telaCheckin = document.getElementById("tela-checkin");

async function conferirAvisoDePrivacidade() {
  try {
    const resposta = await fetch("/api/eu");
    if (resposta.status === 401) {
      irParaLogin();
      return;
    }
    const dados = await resposta.json();
    if (!dados.avisoPrivacidadeVisto) {
      telaCheckin.hidden = true;
      avisoPrivacidade.hidden = false;
      avisoPrivacidade.querySelector("h1").focus();
    }
  } catch (erro) {
    // Sem conexão: segue para o check-in; o aviso aparece numa próxima vez
  }
}

async function fecharAvisoDePrivacidade() {
  try {
    await fetch("/api/aviso-privacidade", { method: "POST" });
  } catch (erro) {
    // Se falhar, o aviso só aparece de novo na próxima vez
  }
  avisoPrivacidade.hidden = true;
  telaCheckin.hidden = false;
  opcoesHumor[0].focus();
}

// ===== Enviar para o servidor =====

async function enviarCheckin(evento) {
  // Impede o navegador de recarregar a página ao enviar o formulário
  evento.preventDefault();
  esconder(erroEnvio);

  const humor = humorEscolhido();
  if (humor === null) {
    mostrarErro(erroHumor, "Escolha um emoji para contar como você está.");
    opcoesHumor[0].focus();
    return;
  }

  const comentario = campoComentario.value.trim().slice(0, LIMITE_COMENTARIO);

  // Desliga o botão enquanto envia, para não mandar duas vezes
  botaoEnviar.disabled = true;
  botaoEnviar.textContent = "Enviando...";

  try {
    const resposta = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ humor: humor, comentario: comentario }),
    });

    if (resposta.ok) {
      mostrarAgradecimento();
      return;
    }

    // 409 = o servidor diz que o check-in de hoje já foi feito
    if (resposta.status === 409) {
      mostrarJaFeito();
      return;
    }

    // 401 = a sessão acabou
    if (resposta.status === 401) {
      irParaLogin();
      return;
    }

    const dados = await resposta.json().catch(function () {
      return {};
    });
    mostrarErro(erroEnvio, dados.erro || "Não foi possível enviar. Tente novamente.");
  } catch (erro) {
    // Sem internet ou servidor desligado
    mostrarErro(erroEnvio, "Não foi possível enviar. Verifique sua conexão e tente novamente.");
  } finally {
    botaoEnviar.disabled = false;
    botaoEnviar.textContent = "Enviar";
  }
}

// Ao abrir a página: mostra o aviso de privacidade (se for o primeiro uso)
// e, se o check-in de hoje já foi feito, não mostra o formulário
conferirAvisoDePrivacidade();
conferirCheckinDeHoje();
document.getElementById("entendi").addEventListener("click", fecharAvisoDePrivacidade);

// Liga cada ação ao evento certo
opcoesHumor.forEach(function (opcao) {
  opcao.addEventListener("change", destacarEmojiEscolhido);
});
campoComentario.addEventListener("input", atualizarContador);
formulario.addEventListener("submit", enviarCheckin);
