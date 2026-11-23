# Casos de teste funcionais — MMVL Telecon

Base: Aula13.pdf (Qualidade de Software), requisitos do sistema e regras implementadas.

Todos os casos são funcionais de caixa-preta. Dados são gerados por execução com prefixo SELENIUM e e-mails exclusivos; senhas ficam somente em memória ou .env.selenium. O status real vem de results.json, nunca desta especificação. Dependência que falhou marca o caso subsequente como bloqueado.

## CT01 — Home pública acessível

- Requisito: Rotas públicas.
- Pré-condições: Sem sessão.
- Procedimento: Abrir / e conferir logo e título institucional.
- Resultado esperado: Logo e conteúdo institucional aparecem sem login.
- Pós-condições: Nenhuma gravação.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT02 — Visitante não acessa área restrita

- Requisito: Sessão.
- Pré-condições: Sem sessão.
- Procedimento: Abrir /budgets, /profile, /dashboard, /dashboard/producers e /dashboard/users.
- Resultado esperado: Budgets, perfil e rotas administrativas redirecionam para login.
- Pós-condições: Permanece sem autenticação.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT03 — Confirmação divergente

- Requisito: Cadastro.
- Pré-condições: E-mail exclusivo da execução.
- Procedimento: Preencher cadastro; senha válida e confirmação Diferente123!; enviar.
- Resultado esperado: Cadastro rejeitado com mensagem amigável.
- Pós-condições: Conta não deve ser criada.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT04 — Cadastro válido

- Requisito: Cadastro.
- Pré-condições: CT03 passou.
- Procedimento: Repetir cadastro com o mesmo e-mail exclusivo e senhas iguais.
- Resultado esperado: Conta criada como COMMON e direcionada aos orçamentos.
- Pós-condições: Conta COMMON temporária criada.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT05 — E-mail duplicado

- Requisito: Cadastro.
- Pré-condições: CT04 passou.
- Procedimento: Enviar novo cadastro com o e-mail já criado e senhas iguais.
- Resultado esperado: Mensagem de e-mail já cadastrado.
- Pós-condições: Conta original preservada.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT06 — Senha incorreta

- Requisito: Login.
- Pré-condições: CT04 passou.
- Procedimento: Abrir login, informar e-mail criado e Errada123!, enviar.
- Resultado esperado: Mensagem de credenciais inválidas e permanência no login.
- Pós-condições: Login inválido não concede acesso.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT07 — Campo obrigatório vazio

- Requisito: Login.
- Pré-condições: Página de login acessível.
- Procedimento: Enviar formulário com e-mail vazio e consultar validity.valueMissing.
- Resultado esperado: Validação HTML bloqueia envio.
- Pós-condições: Navegador bloqueia envio.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT08 — Mostrar e ocultar senha

- Requisito: Usabilidade.
- Pré-condições: Script de visibilidade carregado.
- Procedimento: Clicar no olho duas vezes; verificar atributo type do campo.
- Resultado esperado: Olho alterna password/text sem submeter o formulário.
- Pós-condições: Campo retorna ao tipo password.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT09 — Login COMMON válido

- Requisito: Login.
- Pré-condições: Conta COMMON temporária criada.
- Procedimento: Preencher login com e-mail e senha gerados.
- Resultado esperado: Redirecionamento a /budgets.
- Pós-condições: Sessão COMMON ativa.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT10 — COMMON bloqueado nas URLs administrativas

- Requisito: Permissões.
- Pré-condições: CT09 passou.
- Procedimento: Abrir diretamente as três páginas administrativas.
- Resultado esperado: Acesso restrito em catálogo, fabricantes e usuários.
- Pós-condições: Sessão COMMON continua sem acesso administrativo.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT11 — Logout

- Requisito: Sessão.
- Pré-condições: Conta COMMON autenticada.
- Procedimento: Clicar Sair e tentar abrir /budgets.
- Resultado esperado: Acesso privado volta a exigir login.
- Pós-condições: Sessão encerrada.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT12 — Login ADMIN válido

- Requisito: Login.
- Pré-condições: Conta ADMIN de teste configurada.
- Procedimento: Abrir segundo navegador e efetuar login administrativo.
- Resultado esperado: Dashboard disponível.
- Pós-condições: Sessão ADMIN separada da sessão COMMON.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT13 — Cadastrar fabricante

- Requisito: CRUD fabricantes.
- Pré-condições: CT12 passou.
- Procedimento: Abrir fabricantes; expandir Adicionar fabricante; informar nome SELENIUM exclusivo e salvar.
- Resultado esperado: Fabricante exclusivo da execução aparece na tabela.
- Pós-condições: Fabricante temporário criado.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT14 — Fabricante duplicado

- Requisito: Validação.
- Pré-condições: CT13 passou.
- Procedimento: Repetir o nome do fabricante temporário.
- Resultado esperado: Mensagem amigável de duplicidade.
- Pós-condições: Fabricante não é duplicado.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT15 — Cadastrar produto

- Requisito: CRUD produtos.
- Pré-condições: CT13 passou.
- Procedimento: Abrir modal Adicionar; preencher produto exclusivo, tipo Cat6, preço 10 e fabricante temporário; salvar.
- Resultado esperado: Produto de teste com preço R$ 10 e fabricante correto aparece.
- Pós-condições: Produto temporário criado.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT16 — Preço zero

- Requisito: Validação.
- Pré-condições: CT15 passou.
- Procedimento: Abrir cadastro e edição; informar 0; verificar rangeUnderflow. Desativar noValidate apenas para essa submissão de teste e enviar para verificar também a validação do servidor.
- Resultado esperado: Formulário bloqueia R$ 0 no cadastro e na edição.
- Pós-condições: Produto original mantém preço válido; nenhum produto zero deve ser gravado.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT17 — Editar produto

- Requisito: CRUD produtos.
- Pré-condições: CT15 passou.
- Procedimento: Editar tipo para Cat6 atualizado; salvar; atualizar página; localizar linha.
- Resultado esperado: Mudança de nome/tipo persistida após recarregar.
- Pós-condições: Produto temporário atualizado.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT18 — Produto pesquisável

- Requisito: Orçamentos.
- Pré-condições: CT04 e CT15 passaram.
- Procedimento: Entrar como COMMON; adicionar linha de orçamento; digitar o nome do produto e escolher valor correspondente do datalist.
- Resultado esperado: Pesquisa seleciona o produto cadastrado.
- Pós-condições: Produto válido selecionado.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT19 — Cálculo com margem

- Requisito: Orçamentos.
- Pré-condições: CT18 passou.
- Procedimento: Informar quantidade 2 e margem 10; ler total exibido.
- Resultado esperado: R$ 10 × 2 × 1,10 resulta em R$ 22,00.
- Pós-condições: Rascunho com total R$ 22,00, ainda não salvo.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT20 — Salvar e consultar orçamento

- Requisito: Orçamentos.
- Pré-condições: CT19 passou.
- Procedimento: Informar título exclusivo; salvar; atualizar página e ler histórico.
- Resultado esperado: Orçamento aparece após atualizar a página.
- Pós-condições: Orçamento temporário persistido.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT21 — Isolamento entre contas

- Requisito: Permissões.
- Pré-condições: CT20 passou.
- Procedimento: Cadastrar segunda conta; consultar histórico; tentar POST de exclusão do orçamento da primeira conta usando formulário temporário no navegador; conferir original.
- Resultado esperado: Outra conta não vê nem consegue excluir o orçamento.
- Pós-condições: Orçamento original preservado; segunda conta temporária criada.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT22 — Produto inexistente

- Requisito: Orçamentos.
- Pré-condições: Conta COMMON ativa.
- Procedimento: Adicionar item; escrever produto inexistente; consultar validity.customError.
- Resultado esperado: Texto livre sem produto válido bloqueia envio.
- Pós-condições: Envio bloqueado sem orçamento inválido.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT23 — Trocar senha

- Requisito: Perfil.
- Pré-condições: Conta COMMON temporária existe.
- Procedimento: No perfil, tentar confirmação divergente; conferir mensagem. Depois salvar senha nova válida e efetuar login com ela.
- Resultado esperado: Confirmação diferente é bloqueada; alteração válida permite novo login.
- Pós-condições: Somente senha da conta temporária é alterada.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT24 — Promover e rebaixar conta

- Requisito: Gestão de usuários.
- Pré-condições: CT12 e CT04 passaram.
- Procedimento: ADMIN promove conta temporária; na sessão COMMON já aberta tentar dashboard. ADMIN rebaixa conta e a mesma sessão tenta novamente.
- Resultado esperado: ADMIN passa a acessar dashboard e COMMON perde acesso na sessão aberta.
- Pós-condições: Conta temporária retorna a COMMON.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT25 — Preservar conta com orçamentos

- Requisito: Gestão de usuários.
- Pré-condições: CT12 e CT20 passaram.
- Procedimento: ADMIN tenta excluir a primeira conta temporária; aceitar confirmação e conferir mensagem e linha preservada.
- Resultado esperado: Exclusão bloqueada sem perder o histórico.
- Pós-condições: Conta e orçamento são preservados.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT26 — Sessão de conta excluída

- Requisito: Sessão.
- Pré-condições: CT12 e CT21 passaram.
- Procedimento: ADMIN exclui a segunda conta temporária sem orçamento; tentar /budgets na sessão dessa conta.
- Resultado esperado: Após excluir conta de teste sem orçamento, acesso privado exige login.
- Pós-condições: Conta secundária removida; sessão deixa de conceder acesso.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT27 — Menus e formulários móveis

- Requisito: Responsividade.
- Pré-condições: Sessões ADMIN e COMMON ativas.
- Procedimento: Redimensionar janelas para 320, 390 e 768; abrir orçamento/perfil/catálogo/fabricantes/usuários; medir overflow global e conferir menu móvel abaixo de 768; salvar capturas.
- Resultado esperado: Nas larguras 320/390/768 não há overflow global; campos, menu e tabelas são acessíveis.
- Pós-condições: Janelas retornam a desktop; registros permanecem para limpeza.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.

## CT28 — Excluir registros de teste

- Requisito: CRUD.
- Pré-condições: CT12 passou.
- Procedimento: Excluir orçamento, produto e fabricante exclusivos; excluir contas temporárias sem orçamento. Conferir ausência das linhas.
- Resultado esperado: Orçamento, produto e fabricante exclusivos da execução são removidos.
- Pós-condições: Conta ADMIN fornecida para os testes permanece; demais registros devem ser removidos.
- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.
