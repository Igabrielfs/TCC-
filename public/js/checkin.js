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

// ===== Lembrar no navegador que o check-in de hoje já foi feito =====
// Guardamos só a data (e nunca o humor ou o comentário) para não deixar
// respostas pessoais no computador.

const CHAVE_ULTIMO_CHECKIN = "ultimoCheckin";

// Data de hoje no formato AAAA-MM-DD, usando o fuso horário do computador
function dataDeHoje() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return agora.getFullYear() + "-" + mes + "-" + dia;
}

function jaFezCheckinHoje() {
  try {
    return localStorage.getItem(CHAVE_ULTIMO_CHECKIN) === dataDeHoje();
  } catch (erro) {
    // Se o navegador bloquear o localStorage, deixamos o servidor decidir
    return false;
  }
}

function lembrarCheckinDeHoje() {
  try {
    localStorage.setItem(CHAVE_ULTIMO_CHECKIN, dataDeHoje());
  } catch (erro) {
    // Sem problema: é só uma comodidade
  }
}

// Mostra o aviso de que o check-in de hoje já foi feito, no lugar do formulário
function mostrarJaFeito() {
  formulario.hidden = true;
  document.getElementById("ja-feito").hidden = false;
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
      lembrarCheckinDeHoje();
      mostrarAgradecimento();
      return;
    }

    // 409 = o servidor diz que o check-in de hoje já foi feito
    if (resposta.status === 409) {
      lembrarCheckinDeHoje();
      mostrarJaFeito();
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

// Ao abrir a página, se o check-in de hoje já foi feito, não mostra o formulário
if (jaFezCheckinHoje()) {
  mostrarJaFeito();
}

// Liga cada ação ao evento certo
opcoesHumor.forEach(function (opcao) {
  opcao.addEventListener("change", destacarEmojiEscolhido);
});
campoComentario.addEventListener("input", atualizarContador);
formulario.addEventListener("submit", enviarCheckin);
