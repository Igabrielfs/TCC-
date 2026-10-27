# Plano do Projeto

Este é o planejamento da plataforma de bem-estar. Ainda **não tem código**: aqui decidimos *o que* vamos construir e *em que ordem*. A descrição do projeto está na seção "Sobre o projeto" do `CLAUDE.md`.

## 1. Tecnologias

| Parte | Tecnologia | Para que serve |
|-------|------------|----------------|
| Estrutura das telas | **HTML** | Define o que aparece na página (botões, textos, campos). |
| Visual | **CSS** | Define cores, tamanhos, espaçamentos e a aparência no celular. |
| Comportamento | **JavaScript** | Faz a página reagir (ao clicar num emoji, enviar o check-in etc.). |
| Servidor (a partir da etapa 4) | **JavaScript com Node.js** | Recebe e guarda os dados de todos os funcionários e calcula as médias. |

> **Por que um servidor?** HTML, CSS e JavaScript rodam no **navegador** de cada pessoa. Para o gestor ver a média da equipe, os check-ins de todos precisam ficar num lugar central, que é o servidor. Como o Node.js também usa JavaScript, você não precisa aprender outra linguagem.

## 2. Telas do sistema

### Tela 1: Check-in de humor (funcionário)
É a tela principal e a mais importante. Ela deve ser **muito simples**.
- Mostra a pergunta "Como você está hoje?" e 5 emojis grandes: 😢 😕 😐 🙂 😄 (valores de 1 a 5).
- O funcionário clica em um emoji. É obrigatório escolher um.
- Abaixo aparece um campo de **comentário opcional**, com um limite de caracteres.
- Botão **"Enviar"**. Depois de enviar, aparece uma mensagem de agradecimento.
- Se o funcionário já fez o check-in hoje, a tela avisa e não deixa enviar de novo.

### Tela 2: Pedir ajuda (funcionário)
- O botão **"Preciso de ajuda"** fica visível em todas as telas do funcionário.
- Ao clicar, mostra contatos de apoio (ex.: canal de apoio psicológico da empresa, RH e o **CVV, pelo telefone 188**, que funciona 24h e é gratuito).
- Opcionalmente, permite enviar um pedido de contato para a equipe de apoio (veja a seção 6, "Dúvidas em aberto").

### Tela 3: Login
- Funcionário e gestor entram com usuário e senha.
- O sistema descobre sozinho quem é funcionário e quem é gestor e abre a tela certa.
- Para o funcionário, o login deve ficar salvo, para não precisar digitar a senha todo dia.

### Tela 4: Painel do gestor
- Mostra **somente números da equipe inteira**, nunca o que uma pessoa respondeu:
  - média de humor da equipe na semana e no mês;
  - um gráfico da média ao longo do tempo;
  - quantas pessoas responderam (participação em %).
- **Regra de privacidade:** a média só aparece se pelo menos **5 pessoas** tiverem respondido no período. Com menos gente, aparece "Dados insuficientes".
  > **Por quê?** Numa equipe de 2 pessoas, a média praticamente revela a resposta de cada uma. O mínimo de 5 protege o anonimato.
- Os comentários **não aparecem** para o gestor, porque são respostas individuais.

## 3. Onde os dados vão ficar guardados

### Fase de protótipo (etapas 1 a 3): `localStorage`
O `localStorage` é um "caderninho" que o próprio navegador oferece. Ele guarda dados **só naquele computador**. É ótimo para aprender e testar as telas sem precisar de servidor, mas **não serve para o sistema real**, porque o gestor não consegue ver os dados de outros computadores.

### Fase real (etapa 4 em diante): banco de dados no servidor
Usaremos um banco **SQLite**, que é um banco de dados simples guardado em um único arquivo. As tabelas (criadas em `servidor/banco.js`):

| Tabela | O que guarda |
|--------|--------------|
| `usuarios` | id, nome, e-mail, senha (com **hash**, veja o `SEGURANCA.md`), tipo (funcionário ou gestor), equipe |
| `equipes` | id, nome (o gestor de uma equipe é o usuário do tipo "gestor" daquela equipe) |
| `sessoes` | hash do código de login, id do usuário, data em que o login expira |
| `participacoes` | id do usuário e data: só registra **que** a pessoa fez o check-in naquele dia |
| `checkins` | id aleatório, equipe, data, humor (1 a 5), comentário: **sem o id do usuário** |

> **Por que separar `participacoes` de `checkins`?** A ideia inicial era guardar o id do usuário junto com o humor. Separando, o sistema continua sabendo quem já respondeu hoje (para não deixar responder duas vezes e para calcular a participação), mas a resposta em si não fica ligada à pessoa. Assim, a frase "Sua resposta é anônima" é verdade até para quem abrir o banco de dados. Atenção: num dia em que só uma pessoa da equipe respondeu, ainda dá para deduzir de quem é a resposta olhando o banco direto. Por isso o acesso ao arquivo do banco deve ser restrito.

Cuidados de privacidade (LGPD):
- O **servidor** calcula as médias e entrega ao painel **só o resultado**. As respostas individuais nunca são enviadas para o navegador do gestor.
- Guardar só os dados necessários (princípio da **minimização** da LGPD).
- Definir por quanto tempo os check-ins ficam guardados e apagar os antigos.
- Informar ao funcionário, na primeira vez que ele usar, quais dados são coletados e para quê.

## 4. Etapas de construção (da mais simples para a mais complexa)

Cada etapa termina com algo **funcionando** e com um commit, conforme o `VERSIONAMENTO.md`.
As etapas concluídas estão marcadas com ✅.

1. ✅ **Tela de check-in (só visual).** Criar o HTML e o CSS com os 5 emojis, o campo de comentário e o botão. Ainda não salva nada.
   *Você aprende:* estrutura HTML e estilos CSS.
2. ✅ **Check-in interativo.** Com JavaScript: destacar o emoji clicado, impedir o envio sem emoji, limitar o tamanho do comentário e mostrar a mensagem de agradecimento.
   *Você aprende:* eventos de clique e validação de entrada.
3. ✅ **Salvar no `localStorage` e botão de ajuda.** Guardar o check-in no navegador, impedir dois check-ins no mesmo dia e criar a tela "Preciso de ajuda".
   *Você aprende:* guardar e ler dados com JavaScript.
4. ✅ **Servidor e banco de dados.** Criar o servidor Node.js com SQLite. A tela de check-in passa a enviar os dados para o servidor, que **valida tudo de novo** (regras 1 e 2 do `SEGURANCA.md`).
   *Você aprende:* como o navegador conversa com o servidor (requisições HTTP).
5. ✅ **Login.** Cadastro de usuários com senha protegida por hash, login e separação entre funcionário e gestor.
   *Você aprende:* autenticação e sessões.
6. ✅ **Painel do gestor.** O servidor calcula as médias da equipe (com o mínimo de 5 respostas) e o painel mostra os números e o gráfico.
   *Você aprende:* consultas com agregação (`AVG`, `COUNT`) e gráficos.
7. ✅ **Abrir ao ligar o computador.** Fazer a página abrir sozinha quando o funcionário liga o computador (ex.: um atalho na pasta "Inicializar" do Windows ou configurar a página como página inicial do navegador, com ajuda da TI).
8. **Acabamento.** Visual para celular, acessibilidade (contraste, uso pelo teclado), aviso de privacidade e testes com usuários reais.

## 5. Estrutura de pastas prevista

```
TCC/
├── public/          ← arquivos que o navegador recebe
│   ├── index.html   ← check-in
│   ├── ajuda.html
│   ├── login.html
│   ├── painel.html  ← painel do gestor
│   ├── css/
│   └── js/
└── servidor/        ← código Node.js e banco SQLite (a partir da etapa 4)
```

## 6. Dúvidas em aberto

Estas decisões precisam ser tomadas com o orientador ou com o Sicredi:
- **Quem recebe o pedido de ajuda?** O RH, um psicólogo ou um canal externo? O pedido deve ser anônimo ou identificado?
- **Como o funcionário vai fazer login?** Com um usuário e senha próprios do sistema ou com o login que ele já usa na empresa?
- **Por quanto tempo os check-ins ficam guardados?**
- **O mínimo de 5 respostas para mostrar a média está bom?**
