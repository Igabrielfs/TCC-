# Abrir o check-in ao ligar o computador

A ideia é que o funcionário não precise lembrar de abrir a plataforma: ao entrar no Windows, o navegador abre sozinho na tela de check-in. Como o login do funcionário fica salvo por 30 dias, normalmente ele já cai direto nos emojis.

Há três jeitos de fazer isso, do mais simples ao mais "profissional".

## Opção 1: comando pronto (para testar no seu computador)

Com o projeto instalado, rode:

```bash
npm run atalho
```

Isso cria o arquivo `Check-in de bem-estar.url` na pasta **Inicializar** do Windows, apontando para `http://localhost:3000`. Para usar outro endereço (ex.: o servidor da empresa):

```bash
npm run atalho -- --endereco https://bem-estar.empresa.com.br
```

Para desfazer:

```bash
npm run atalho -- --remover
```

> **Por que um arquivo `.url`?** É um "atalho de internet" do Windows: ao ser aberto, ele abre o endereço no navegador padrão. Não é um programa e não precisa de permissão de administrador.

## Opção 2: manual (sem instalar nada)

1. Aperte `Windows + R`, digite `shell:startup` e aperte Enter. Abre a pasta **Inicializar**.
2. Clique com o botão direito em um espaço vazio → **Novo** → **Atalho**.
3. Em "local do item", cole o endereço da plataforma (ex.: `https://bem-estar.empresa.com.br`).
4. Dê o nome "Check-in de bem-estar" e conclua.

## Opção 3: pela TI da empresa (para todos os funcionários)

Num ambiente corporativo, o ideal é a TI distribuir isso de forma centralizada, por exemplo:

- **Política de grupo (GPO)**, copiando o atalho `.url` para a pasta Inicializar de todos os usuários; ou
- **Política do navegador** (Edge ou Chrome), definindo a plataforma como página aberta na inicialização.

Assim ninguém precisa configurar nada e a TI consegue desligar tudo de uma vez se precisar.

> **Importante:** abrir a página sozinha é um convite, não uma obrigação. O funcionário pode fechar a janela, e o check-in continua opcional.
