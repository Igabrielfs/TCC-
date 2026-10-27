# Plataforma de bem-estar (TCC)

Plataforma web de bem-estar para os colaboradores do Sicredi.

- **Funcionário:** faz um check-in diário de humor com emojis, pode deixar um comentário opcional e tem o botão "Preciso de ajuda".
- **Gestor:** vê um painel só com **médias da equipe**, nunca respostas individuais (LGPD).

O planejamento está no [`PLANO.md`](PLANO.md). As regras do projeto estão em [`VERSIONAMENTO.md`](VERSIONAMENTO.md) e [`SEGURANCA.md`](SEGURANCA.md).

## 1. Instalar

1. Instale o **Node.js 22.13 ou mais novo** (versão LTS). No Windows, você pode usar o site [nodejs.org](https://nodejs.org) ou o comando:
   ```bash
   winget install OpenJS.NodeJS.LTS
   ```
2. Na pasta do projeto, instale as dependências:
   ```bash
   npm install
   ```
3. (Opcional) Copie `.env.example` para `.env` e ajuste as configurações (porta, prazo de guarda dos dados etc.).

## 2. Criar dados de demonstração

```bash
npm run demo
```

Isso cria duas equipes de exemplo, com check-ins das últimas 10 semanas:

| Usuário | Tipo | Para que serve |
|---------|------|----------------|
| `pessoa1.demo@example.com` … `pessoa8.demo@example.com` | funcionário | testar o check-in |
| `gestor.demo@example.com` | gestor | painel com médias e gráfico |
| `gestor.pequena@example.com` | gestor | equipe com 3 pessoas: mostra "Dados insuficientes" |

A **senha** de todos é sorteada e aparece **uma única vez** no terminal: anote. Para recomeçar, apague `servidor/dados/bem-estar.db` e rode `npm run demo` de novo.

## 3. Rodar

```bash
npm start
```

Abra **http://localhost:3000** no navegador.

## 4. Como testar cada tela

> **Dica:** para entrar como outra pessoa, clique em **Sair** ou use uma janela anônima.

**Login**
1. Abra http://localhost:3000. Sem login, você é levado para a tela de login.
2. Erre a senha: aparece "E-mail ou senha inválidos." (a mensagem não diz qual dos dois errou).
3. Depois de 5 erros seguidos, o login fica bloqueado por 15 minutos.

**Aviso de privacidade (funcionário)**
1. Entre como `pessoa1.demo@example.com`.
2. Na primeira vez, aparece "Antes de começar", explicando quais dados são guardados. Clique em **Entendi**.
3. Saia e entre de novo: o aviso não aparece mais. O texto completo fica em "Saiba mais".

**Check-in (funcionário)**
1. Clique em **Enviar** sem escolher um emoji: aparece um aviso pedindo para escolher.
2. Escolha um emoji (ele fica destacado), escreva um comentário (o contador mostra o limite de 280) e envie.
3. Aparece "Obrigado por compartilhar!". Recarregue a página: aparece "Você já fez o check-in hoje".
4. Pelo teclado: use Tab para chegar aos emojis, as setas para escolher e Enter no botão **Enviar**.

**Preciso de ajuda**
1. Clique em **Preciso de ajuda** (canto de cima, em todas as telas do funcionário e no login).
2. Aparecem o CVV (188) e o SAMU (192). Os contatos internos do Sicredi ainda estão "a definir".

**Painel do gestor**
1. Entre como `gestor.demo@example.com`.
2. Veja a média e a participação da **última semana** e do **último mês** completos, além do gráfico das últimas 8 semanas.
3. Uma das semanas aparece como "Dados insuficientes" (menos de 5 pessoas responderam).
4. Clique em "Ver dados em tabela" para ver os mesmos números em forma de tabela.
5. Entre como `gestor.pequena@example.com`: tudo aparece como "Dados insuficientes".

**Separação entre funcionário e gestor**
- Logado como funcionário, tente abrir http://localhost:3000/painel.html: você volta para o check-in.
- Logado como gestor, tente abrir http://localhost:3000/: você vai para o painel.

**No celular**
- Coloque `HOST=0.0.0.0` no `.env`, reinicie o servidor e abra `http://<ip-do-computador>:3000` no celular (na mesma rede Wi-Fi).
- Ou, no Chrome do computador, aperte F12 e ative o modo de celular (ícone de celular/tablet).

**Abrir ao ligar o computador**
- Veja [`docs/abrir-ao-ligar.md`](docs/abrir-ao-ligar.md) (comando `npm run atalho`).

## 5. Testes automáticos

```bash
npm test
```

São 35 testes. Eles conferem a validação dos dados, o login, a proteção das páginas, as regras de privacidade do painel, o prazo de guarda e o aviso de privacidade.

## 6. Cadastrar usuários de verdade

```bash
npm run criar-usuario -- --nome "Ana Souza" --email ana@empresa.com --tipo funcionario --equipe "Agência Centro"
```

A senha é pedida em seguida e não aparece na tela. O tipo pode ser `funcionario` ou `gestor`. O gestor acompanha a equipe informada em `--equipe`.

## 7. Estrutura de pastas

```
TCC/
├── public/              ← o que o navegador recebe
│   ├── index.html       ← check-in (funcionário)
│   ├── ajuda.html       ← "Preciso de ajuda"
│   ├── login.html
│   ├── painel.html      ← painel do gestor
│   ├── privacidade.html ← aviso de privacidade completo
│   ├── css/style.css
│   └── js/
├── servidor/            ← Node.js + SQLite
│   ├── index.js         ← inicia o servidor
│   ├── app.js           ← rotas
│   ├── banco.js         ← tabelas
│   ├── autenticacao.js  ← login e sessões
│   ├── painel.js        ← cálculo das médias
│   ├── retencao.js      ← apaga dados antigos
│   └── dados/           ← arquivo do banco (fora do Git)
├── testes/              ← testes automáticos
├── ferramentas/         ← atalho para abrir ao ligar o computador
└── docs/                ← guias
```

## 8. Privacidade e segurança (resumo)

- A resposta de humor é guardada **sem o id de quem respondeu**. Uma tabela separada registra só *que* a pessoa respondeu naquele dia.
- O gestor recebe só médias, com **no mínimo 5 pessoas**, e só de **períodos já encerrados**. Assim, comparar os números de um dia para o outro não revela a resposta de ninguém.
- Senhas com **bcrypt**. Login em cookie `HttpOnly` e `SameSite=Strict`, e o banco guarda só o hash do código de login.
- Toda entrada é validada **no servidor** (lista de permitidos), e todas as consultas ao banco são parametrizadas.
- Fonte e biblioteca de gráficos são entregues pelo próprio servidor: nenhum dado vai para terceiros.
- Check-ins são apagados automaticamente depois de `RETENCAO_DIAS` dias (padrão: 365).
