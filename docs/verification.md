# Verificação — 15/11/2026

## Confirmações posteriores pelo usuário em produção

- Layout mobile e pesquisa de produtos funcionando.
- Cadastro bloqueia senhas diferentes e aceita confirmação correta.
- Login bloqueia senha errada; `/budgets` sem sessão exige login.
- Conta COMMON cria e consulta orçamentos; URLs administrativas foram bloqueadas.
- Orçamentos de uma conta não aparecem nas demais.

Após essas verificações, foram corrigidos preço zero no cadastro/edição de produtos e rótulos visíveis Produto, Quantidade, Margem (%) e Total do item. A margem representa acréscimo sobre o preço. Produto legado com preço zero é rejeitado ao gerar orçamento até o administrador corrigir o preço. Os testes automatizados passaram; essas duas mudanças ainda precisam de deploy e reteste em produção.

## Execução realizada

`npm test`: quatro arquivos de teste aprovados. A suíte `test/flows.test.js` chama os routers Express reais, incluindo os middlewares, os controllers, bcrypt e os templates EJS. Um adaptador em memória substitui apenas os models e as transações do MySQL. Não foram criados nem excluídos registros no Aiven.

Cobertura executada:

- Login/cadastro públicos e redirecionamento de visitante sem sessão.
- Cadastro com senha bcrypt e papel COMMON, rejeitando elevação via formulário.
- Cadastro duplicado, senha incorreta, login válido, logout e alteração de senha.
- Resposta 403 ao COMMON em todas as rotas GET/POST administrativas de produtos, fabricantes e usuários.
- Acesso do ADMIN às telas de catálogo, fabricantes e usuários.
- Cadastro, edição e exclusão de produto; preço negativo não altera o registro.
- Cadastro/exclusão de fabricante e preservação dos produtos ao desvincular.
- Criação de orçamento com quantidade e margem, total calculado no servidor e dono derivado da sessão.
- Listagem restrita ao usuário e bloqueio de exclusão de orçamento de outra conta.
- Alteração de papel e revogação de acesso na sessão já aberta.
- Token inválido na gestão de usuários, proteção do último ADMIN e da própria conta.
- Preservação de conta com orçamentos; exclusão de conta sem orçamentos e invalidação de seu acesso.
- Validação de IDs, e-mail, tamanho de senha, preço, margem, quantidade, JSON e produto inativo.
- Mensagens de erro amigáveis sem SQL ou credenciais expostos.

As transações, constraints, TLS e persistência real do MySQL não foram exercitadas por esse adaptador. Os testes de autorização usam os mesmos arquivos de rotas da aplicação; não levantam servidor HTTP.

## Revisão de responsividade

Foi realizada revisão estática dos templates e estilos. Ajustes:

- Busca do catálogo passa a caber na largura disponível no celular.
- Modal de produto tem limite de altura e rolagem para acessar os botões em telas baixas.
- Campos móveis têm fonte de 16 px e não forçam largura mínima do documento.
- Menu móvel público inclui Empresa, Serviços, Contato e Login; o administrativo respeita o papel.
- Menu móvel aberto tem rolagem quando excede a altura disponível.
- Dropdown administrativo também abre por foco do teclado.
- E-mails longos na seção de contato podem quebrar linha.
- Tabelas continuam com rolagem horizontal dentro do próprio contêiner.
- Removida marcação HTML excedente no cabeçalho e corrigido escape dos dados no botão de edição.

**Limitação:** não houve validação visual executada no navegador. O Chromium instalado foi impedido de iniciar por restrição de socket (`Operation not permitted`). A abertura de servidor local falhou com `EPERM` e o acesso ao domínio Render falhou com `ENOTFOUND`. Essas falhas são do ambiente de execução desta revisão, não um diagnóstico de indisponibilidade do site.

## Aceite pendente no site publicado

Após publicar as alterações, usar https://projetodeexten-o4.onrender.com:

1. Com contas de teste COMMON e ADMIN, repetir cadastro/login/logout, CRUD e orçamento. Excluir somente registros criados para teste.
2. COMMON: tentar `/dashboard`, `/dashboard/producers` e `/dashboard/users`; esperar acesso negado e ausência desses menus.
3. ADMIN: abrir Usuários, promover/rebaixar a conta de teste; confirmar a mudança na sessão dessa conta.
4. Criar produto e fabricante de teste, editar preço, gerar orçamento e verificar no Aiven se o registro persistiu. Excluir o orçamento antes de excluir o usuário de teste.
5. Repetir a navegação em 320×568, 390×844, 768×1024 e desktop. Abrir menu, rolar tabela, preencher cadastro/login, abrir modal e testar com o teclado virtual visível.
6. Confirmar ausência de rolagem horizontal do documento, mantendo rolagem local nas tabelas; conferir botões do modal e mensagens de erro.
7. Testar pesquisa e seleção de produto, quantidade, margem e total em orçamento. Texto sem produto selecionado deve bloquear o envio.

Resultado de produção e aceite visual: **pendentes**, não declarados como aprovados nesta revisão.
