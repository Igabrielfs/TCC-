# Regras de Segurança

Este arquivo reúne as regras de segurança do projeto. Cada regra explica **o que fazer** e **por quê**.

## 1. Nunca confie na entrada do usuário

Todo dado que vem de fora do programa (formulários, URLs, arquivos enviados, APIs externas) deve ser **validado** antes de ser usado.

Valide sempre:

- **Tipo**: se espera um número, confirme que é um número.
- **Tamanho**: limite o comprimento de textos (ex.: nome com no máximo 100 caracteres).
- **Formato**: confira padrões como e-mail, CPF ou data.
- **Faixa de valores**: ex.: idade entre 0 e 150.
- **Obrigatoriedade**: campos obrigatórios não podem vir vazios.

Prefira **lista de permitidos** (aceitar só o que é válido) em vez de **lista de proibidos** (tentar bloquear o que é perigoso).

> **Por quê?** Um usuário mal-intencionado pode enviar dados feitos para quebrar ou invadir o sistema. É impossível prever todos os ataques, mas é fácil descrever o que é válido.

## 2. Valide no servidor, não só na tela

A validação no navegador (front-end) é bem-vinda, mas a validação que **realmente vale** é a do servidor (back-end).

> **Por quê?** Qualquer pessoa pode desativar o JavaScript ou enviar requisições direto ao servidor, pulando a validação da tela.

## 3. Use consultas parametrizadas no banco de dados

Nunca monte comandos SQL juntando textos com dados do usuário.

```python
# ERRADO — vulnerável a SQL Injection
cursor.execute("SELECT * FROM usuarios WHERE email = '" + email + "'")

# CERTO — consulta parametrizada
cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
```

> **Por quê?** No jeito errado, alguém pode digitar algo como `' OR '1'='1` e ler ou apagar dados do banco. A consulta parametrizada trata a entrada sempre como dado, nunca como comando.

## 4. Escape dados ao exibi-los na página

Ao mostrar na tela algo que o usuário digitou, use os mecanismos de escape do seu framework/template (ex.: `{{ }}` no Jinja, React por padrão) e evite inserir HTML cru (`innerHTML`, `dangerouslySetInnerHTML`).

> **Por quê?** Evita o ataque **XSS**, em que alguém salva um código JavaScript (ex.: num comentário) que roda no navegador de outros usuários.

## 5. Nunca coloque segredos no código

Senhas, chaves de API e tokens devem ficar em **variáveis de ambiente** ou num arquivo `.env`, que está listado no `.gitignore`.

> **Por quê?** Tudo que entra no Git fica no histórico para sempre, mesmo que você apague depois. Se o repositório for público, qualquer um pode encontrar e usar suas chaves.

## 6. Guarde senhas com hash, nunca em texto puro

Use algoritmos próprios para senhas, como **bcrypt** ou **Argon2**. Nunca use MD5 ou SHA-1 para isso.

> **Por quê?** Se o banco de dados vazar, o atacante não consegue ler as senhas originais. Algoritmos como bcrypt são lentos de propósito, dificultando ataques de força bruta.

## 7. Mostre mensagens de erro genéricas

Para o usuário, exiba mensagens simples ("E-mail ou senha inválidos"). Detalhes técnicos (stack trace, SQL) devem ir apenas para o log.

> **Por quê?** Mensagens detalhadas revelam como o sistema funciona por dentro e ajudam um atacante a planejar o ataque.

## 8. Dê apenas as permissões necessárias

Cada usuário, serviço ou conexão de banco deve ter **só** as permissões que realmente precisa (princípio do menor privilégio).

> **Por quê?** Se uma parte do sistema for invadida, o estrago fica limitado ao que aquela parte podia fazer.

## 9. Mantenha as dependências atualizadas

Atualize bibliotecas com frequência e use ferramentas como `npm audit` ou `pip-audit` para encontrar falhas conhecidas.

> **Por quê?** Muitas invasões exploram falhas antigas, já corrigidas em versões novas das bibliotecas.
