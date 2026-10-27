# Roteiro de testes com usuários reais

Os testes automáticos (`npm test`) conferem se o sistema **funciona**. Este roteiro serve para descobrir se ele é **fácil de usar**, observando pessoas de verdade. Ele faz parte da etapa 8 do `PLANO.md`.

## Quem convidar

- **5 funcionários** (com idades e familiaridade com tecnologia variadas).
- **2 gestores**.

Cinco pessoas já costumam revelar a maior parte dos problemas de uso.

## Antes de começar

1. Rode `npm run demo` num banco de teste (nunca no banco real) e anote a senha mostrada.
2. Explique: *"Estamos testando o sistema, não você. Não existe resposta errada. Pense em voz alta enquanto usa."*
3. Peça autorização para anotar (não grave nada sem consentimento).

## Tarefas para o funcionário

Dê uma tarefa por vez, sem explicar como fazer:

| # | Tarefa | O que observar |
|---|--------|----------------|
| 1 | "Entre no sistema com este e-mail e senha." | Achou os campos? Entendeu os erros? |
| 2 | "Leia o aviso que aparecer e continue." | Leu ou pulou? Entendeu que a resposta é anônima? |
| 3 | "Conte como você está hoje." | Quanto tempo levou? Hesitou entre emojis? |
| 4 | "Agora tente responder de novo." | Entendeu o aviso de "já fez hoje"? |
| 5 | "Imagine um dia difícil: onde você buscaria ajuda?" | Encontrou o botão "Preciso de ajuda" sozinho? |
| 6 | (pelo celular) Repetir a tarefa 3 | Os emojis são fáceis de tocar? |

## Tarefas para o gestor

| # | Tarefa | O que observar |
|---|--------|----------------|
| 1 | "Como está o humor da sua equipe na última semana?" | Achou e entendeu o número? |
| 2 | "O humor melhorou ou piorou nas últimas semanas?" | Entendeu o gráfico? |
| 3 | "Por que uma das semanas mostra 'Dados insuficientes'?" | Entendeu a regra das 5 pessoas? |

## Perguntas no final

1. De 1 a 5, quão fácil foi usar? (1 = muito difícil, 5 = muito fácil)
2. Você confiaria que sua resposta é anônima? Por quê?
3. Você usaria isso todo dia? O que faria você desistir?
4. O que você mudaria?

## Registro dos resultados

Para cada pessoa, anote: tempo de cada tarefa, onde travou, frases marcantes e a nota de facilidade. Depois, junte os problemas que apareceram com mais de uma pessoa: eles são a prioridade das próximas mudanças.
