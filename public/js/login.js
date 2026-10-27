// ===== Tela de login =====

const formulario = document.getElementById("form-login");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const erroLogin = document.getElementById("erro-login");
const botaoEntrar = formulario.querySelector('button[type="submit"]');

function mostrarErro(texto) {
  // textContent (e não innerHTML): o texto nunca é tratado como código
  erroLogin.textContent = texto;
  erroLogin.hidden = false;
}

async function entrar(evento) {
  evento.preventDefault();
  erroLogin.hidden = true;

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  // Validação rápida na tela (o servidor valida de novo)
  if (email === "" || senha === "") {
    mostrarErro("Preencha o e-mail e a senha.");
    (email === "" ? campoEmail : campoSenha).focus();
    return;
  }

  botaoEntrar.disabled = true;
  botaoEntrar.textContent = "Entrando...";

  try {
    const resposta = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, senha: senha }),
    });
    const dados = await resposta.json().catch(function () {
      return {};
    });

    if (resposta.ok) {
      // O servidor diz para onde ir: check-in (funcionário) ou painel (gestor).
      // Só aceitamos endereços do próprio site.
      window.location.href = dados.destino === "/painel.html" ? "/painel.html" : "/";
      return;
    }

    mostrarErro(dados.erro || "Não foi possível entrar. Tente novamente.");
    campoSenha.value = "";
    campoSenha.focus();
  } catch (erro) {
    mostrarErro("Não foi possível entrar. Verifique sua conexão e tente novamente.");
  } finally {
    botaoEntrar.disabled = false;
    botaoEntrar.textContent = "Entrar";
  }
}

formulario.addEventListener("submit", entrar);
