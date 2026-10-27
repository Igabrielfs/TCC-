// ===== Botão "Sair" =====
// Usado nas telas de quem está logado. Encerra a sessão e volta para o login.

const botaoSair = document.getElementById("sair");

botaoSair.addEventListener("click", async function () {
  try {
    await fetch("/api/logout", { method: "POST" });
  } finally {
    window.location.href = "/login.html";
  }
});
