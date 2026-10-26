# Regras de Versionamento

Este arquivo explica como usamos o Git neste projeto. Cada regra vem com uma explicação do **porquê** ela existe.

## 1. Faça commits pequenos e frequentes

Cada commit deve conter **uma única mudança lógica** (ex.: "adiciona tela de login", e não "várias coisas").

> **Por quê?** Commits pequenos são fáceis de entender e, se algo quebrar, fica simples descobrir qual mudança causou o problema e desfazer só ela.

## 2. Escreva mensagens de commit claras

Use o formato `tipo: descrição curta`, no imperativo e em português:

| Tipo       | Quando usar                          | Exemplo                               |
|------------|--------------------------------------|---------------------------------------|
| `feat`     | Nova funcionalidade                  | `feat: adiciona cadastro de usuário`  |
| `fix`      | Correção de erro                     | `fix: corrige cálculo da média`       |
| `docs`     | Mudança só em documentação           | `docs: atualiza instruções do README` |
| `refactor` | Melhoria no código sem mudar o comportamento | `refactor: simplifica validação` |
| `test`     | Adição ou ajuste de testes           | `test: adiciona testes do login`      |
| `chore`    | Tarefas de manutenção (configs, dependências) | `chore: atualiza .gitignore`  |

> **Por quê?** Uma boa mensagem é um recado para o "você do futuro" (e para o orientador do TCC). Lendo só o histórico (`git log`), dá para entender a evolução do projeto.

## 3. Não trabalhe direto na branch principal

A branch `main` deve conter sempre uma versão que **funciona**. Para cada nova tarefa, crie uma branch separada:

```bash
git switch -c feat/nome-da-tarefa
```

Quando terminar e testar, junte (merge) de volta na `main`.

> **Por quê?** Assim você pode experimentar à vontade sem estragar a versão estável. Se der errado, é só apagar a branch.

## 4. Teste antes de fazer commit

Antes de `git commit`, rode o projeto e verifique se nada quebrou.

> **Por quê?** Um commit que quebra o projeto atrapalha todo mundo que for usar aquela versão — inclusive você mesmo, ao voltar no histórico.

## 5. Revise o que vai ser commitado

Antes de commitar, use:

```bash
git status      # mostra quais arquivos mudaram
git diff        # mostra exatamente o que mudou
```

> **Por quê?** Evita enviar sem querer arquivos de teste, senhas ou código pela metade.

## 6. Nunca reescreva o histórico já compartilhado

Não use `git push --force` nem `git commit --amend` em commits que já foram enviados para o GitHub.

> **Por quê?** Reescrever o histórico pode apagar o trabalho de outras pessoas (ou o seu, em outro computador). Se errou, faça um **novo commit** corrigindo.

## 7. Marque versões importantes com tags

Quando chegar a um marco (ex.: entrega parcial do TCC), crie uma tag seguindo o padrão `vMAIOR.MENOR.CORREÇÃO`:

```bash
git tag v1.0.0
```

- **MAIOR**: mudanças grandes, que alteram como o sistema funciona.
- **MENOR**: novas funcionalidades que não quebram o que já existia.
- **CORREÇÃO**: apenas correções de erros.

> **Por quê?** Tags funcionam como "marcadores de página": você consegue voltar exatamente à versão que foi entregue ou apresentada.
