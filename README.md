# MMVL Telecon — Express + EJS + MySQL

Versão do sistema original migrada para a stack obrigatória do Projeto de Extensão WEB 2: Node.js, Express, EJS, MySQL, MVC, sessões e bcrypt.

## Rodando localmente

1. Crie um banco MySQL chamado `mmvl_telecon`.
2. Copie `.env.example` para `.env` e ajuste as credenciais.
3. Instale as dependências: `npm install`.
4. Crie as tabelas: `npm run db:init`.
5. Inicie: `npm run dev`.

Para preencher o catálogo com dados de demonstração: `npm run db:seed`.

O cadastro é feito diretamente em `/register`, com e-mail e senha. As senhas são armazenadas com hash bcrypt.

## Estrutura MVC

- `src/models`: modelos Sequelize e conexão MySQL.
- `src/controllers`: regras de negócio e validações.
- `src/routes`: rotas públicas, autenticação e área restrita.
- `src/views`: páginas EJS e partials reutilizáveis.
- `public`: CSS e imagens estáticas.

## Conformidade com o enunciado

- Node.js e Express no back-end.
- EJS como motor de templates no front-end renderizado pelo servidor.
- MySQL relacional acessado por Sequelize e `mysql2`.
- MVC separado em models, controllers, routes, middleware e views.
- Rotas públicas: página institucional, login e cadastro.
- Área restrita protegida por middleware de sessão.
- CRUD de produtos e fabricantes, além de criação e exclusão de orçamentos.
- Validação de formulários e mensagens de erro amigáveis.
- Credenciais mantidas em variáveis de ambiente.

## Deploy

## Permissões de usuários

O cadastro público cria contas `COMMON`, com acesso aos próprios orçamentos e perfil. Contas `ADMIN` também podem cadastrar, editar e excluir produtos e fabricantes. As rotas de gerenciamento verificam o papel no banco em cada requisição. O nome dos fabricantes continua sem campo de edição nas linhas da tabela.

Administradores acessam `/dashboard/users` pelo menu Dashboard → Usuários para listar contas, alterar papéis e excluir contas sem orçamentos. A própria conta não pode ser excluída e o último administrador não pode ser rebaixado. Contas com orçamentos são preservadas para manter o histórico. Os formulários de gerenciamento de usuários exigem um token de sessão.

A inicialização adiciona a coluna `role` caso não exista. Contas existentes recebem `COMMON`. Para promover uma conta já cadastrada, execute com as variáveis do banco configuradas:

```bash
npm run user:role -- email@exemplo.com ADMIN
```

Para remover a permissão administrativa, use `COMMON` no lugar de `ADMIN`. O comando funciona também conectado ao Aiven e não altera a senha da conta.

No Render, use um Web Service Node, configure as variáveis do `.env`, conecte o repositório GitHub/GitLab e use `npm start` como comando de inicialização. O banco MySQL deve estar hospedado e acessível pela internet.
