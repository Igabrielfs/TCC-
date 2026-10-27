// ===== Painel do gestor =====
// Busca no servidor os números da equipe (só médias) e mostra na tela.

const SEM_DADOS = "Dados insuficientes";

// Mesmos emojis da tela de check-in, para o gestor entender a escala
const EMOJI_DO_HUMOR = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

// "2026-10-19" -> "19/10"
function diaEMes(dataTexto) {
  const partes = dataTexto.split("-");
  return partes[2] + "/" + partes[1];
}

function nomeDoPeriodo(periodo) {
  return diaEMes(periodo.inicio) + " a " + diaEMes(periodo.fim);
}

// 3.8 -> "3,8"
function formatarMedia(media) {
  return media.toFixed(1).replace(".", ",");
}

function escrever(id, texto) {
  // textContent (e não innerHTML): o texto nunca é tratado como código
  document.getElementById(id).textContent = texto;
}

// Preenche um cartão de indicador (semana ou mês)
function mostrarIndicador(prefixo, periodo) {
  escrever(prefixo + "-periodo", nomeDoPeriodo(periodo));
  const numero = document.getElementById(prefixo + "-media");
  if (periodo.media === null) {
    numero.textContent = SEM_DADOS;
    numero.classList.add("sem-dados");
  } else {
    numero.textContent = EMOJI_DO_HUMOR[Math.round(periodo.media)] + " " + formatarMedia(periodo.media) + " de 5";
    numero.classList.remove("sem-dados");
  }
  escrever(prefixo + "-participacao", periodo.participacao + "% da equipe respondeu");
}

// Monta a tabela com os mesmos dados do gráfico
function mostrarTabela(semanas) {
  const corpo = document.getElementById("tabela-corpo");
  corpo.replaceChildren();
  semanas.forEach(function (semana) {
    const linha = document.createElement("tr");
    [
      nomeDoPeriodo(semana),
      semana.media === null ? SEM_DADOS : formatarMedia(semana.media),
      semana.participacao + "%",
    ].forEach(function (texto) {
      const celula = document.createElement("td");
      celula.textContent = texto;
      linha.appendChild(celula);
    });
    corpo.appendChild(linha);
  });
}

// Lê uma cor definida no CSS (assim o gráfico usa as mesmas cores da página)
function corDoTema(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

function mostrarGrafico(semanas) {
  const corLinha = corDoTema("--cor-grafico");
  const corTexto = corDoTema("--cor-texto-suave");
  const corGrade = corDoTema("--cor-borda");

  // Mesma fonte da página
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  // Quem pediu ao sistema para "reduzir movimento" vê o gráfico sem animação
  const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  new Chart(document.getElementById("grafico"), {
    type: "line",
    data: {
      // No eixo, só o dia em que a semana começa (o período completo aparece ao passar o mouse)
      labels: semanas.map(function (s) {
        return diaEMes(s.inicio);
      }),
      datasets: [
        {
          label: "Média de humor",
          data: semanas.map(function (s) {
            return s.media;
          }),
          borderColor: corLinha,
          backgroundColor: corLinha,
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          spanGaps: false, // semana sem dados suficientes fica como um "buraco" na linha
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: semAnimacao ? false : { duration: 600 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false }, // uma linha só: o título já explica
        tooltip: {
          callbacks: {
            title: function (itens) {
              return "Semana de " + nomeDoPeriodo(semanas[itens[0].dataIndex]);
            },
            label: function (contexto) {
              const media = semanas[contexto.dataIndex].media;
              return media === null ? SEM_DADOS : "Média: " + formatarMedia(media) + " de 5";
            },
            afterLabel: function (contexto) {
              return "Participação: " + semanas[contexto.dataIndex].participacao + "%";
            },
          },
        },
      },
      scales: {
        y: {
          min: 1,
          max: 5,
          ticks: {
            stepSize: 1,
            color: corTexto,
            callback: function (valor) {
              return EMOJI_DO_HUMOR[valor] + " " + valor;
            },
          },
          grid: { color: corGrade },
          border: { display: false },
        },
        x: {
          title: { display: true, text: "Semana que começa em", color: corTexto },
          ticks: { color: corTexto, maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
      },
    },
  });
}

async function carregarPainel() {
  try {
    const resposta = await fetch("/api/painel");
    if (resposta.status === 401 || resposta.status === 403) {
      window.location.href = "/login.html";
      return;
    }
    if (!resposta.ok) {
      throw new Error("Resposta " + resposta.status);
    }
    const dados = await resposta.json();

    escrever("nome-equipe", dados.equipe + " · " + dados.totalEquipe + " pessoas");
    escrever("minimo-pessoas", String(dados.minimoPessoas));
    mostrarIndicador("semana", dados.semana);
    mostrarIndicador("mes", dados.mes);
    mostrarTabela(dados.grafico);
    mostrarGrafico(dados.grafico);
  } catch (erro) {
    const aviso = document.getElementById("erro-painel");
    aviso.textContent = "Não foi possível carregar os dados. Tente recarregar a página.";
    aviso.hidden = false;
  }
}

carregarPainel();
