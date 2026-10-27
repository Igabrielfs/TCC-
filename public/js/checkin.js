// ===== Tela de check-in de humor =====

// Limite de caracteres do comentário (o mesmo do "maxlength" no HTML)
const LIMITE_COMENTARIO = 280;

// Pega os elementos da página que vamos usar
const formulario = document.getElementById("form-checkin");
const opcoesHumor = document.querySelectorAll('input[name="humor"]');
const erroHumor = document.getElementById("erro-humor");
const campoComentario = document.getElementById("comentario");
const contador = document.getElementById("contador");
const agradecimento = document.getElementById("agradecimento");

// Destaca o emoji clicado: tira o destaque de todos e coloca só no escolhido
function destacarEmojiEscolhido() {
  opcoesHumor.forEach(function (opcao) {
    opcao.closest(".emoji").classList.toggle("selecionado", opcao.checked);
  });
  esconderErro();
}

function mostrarErro(texto) {
  // textContent (e não innerHTML) garante que o texto é mostrado como texto, nunca como código
  erroHumor.textContent = texto;
  erroHumor.hidden = false;
}

function esconderErro() {
  erroHumor.hidden = true;
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

function enviarCheckin(evento) {
  // Impede o navegador de recarregar a página ao enviar o formulário
  evento.preventDefault();

  const humor = humorEscolhido();
  if (humor === null) {
    mostrarErro("Escolha um emoji para contar como você está.");
    opcoesHumor[0].focus();
    return;
  }

  const comentario = campoComentario.value.trim().slice(0, LIMITE_COMENTARIO);

  // Por enquanto o check-in ainda não é guardado em lugar nenhum
  console.log("Check-in:", { humor: humor, comentario: comentario });
  mostrarAgradecimento();
}

// Liga cada ação ao evento certo
opcoesHumor.forEach(function (opcao) {
  opcao.addEventListener("change", destacarEmojiEscolhido);
});
campoComentario.addEventListener("input", atualizarContador);
formulario.addEventListener("submit", enviarCheckin);
