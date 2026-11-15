# MMVL Telecon

Aplicação do Projeto de Extensão WEB 2 para catálogo de produtos de telecomunicações, fabricantes, orçamentos e controle de acesso.

**Site:** https://projetodeexten-o4.onrender.com  
**Repositório utilizado no deploy:** https://github.com/gustavopgcampos/projetoDeExten-o4

## Stack e arquitetura

Node.js, Express 5, EJS, MySQL, Sequelize/mysql2, express-session e bcryptjs (hash bcrypt com custo 12). O Express renderiza HTML no servidor com dados do banco. JavaScript no navegador complementa os modais, a pesquisa de produtos e a visibilidade da senha.

```text
src/
  config/       Conexão MySQL, TLS e migração dos papéis
  models/       Entidades e relacionamentos Sequelize
  controllers/  Regras de negócio e operações de cadastro
  routes/       Rotas públicas e autenticadas
  middleware/   Autenticação, autorização, mensagens e erros
  lib/          Validações compartilhadas
  views/        Páginas EJS, layouts e partials
public/         Imagens, CSS e JavaScript do navegador
scripts/        Inicialização, dados demonstrativos e administração
test/           Testes automatizados com dados isolados
docs/           Relatório de verificação e roteiro de aceite
```

Fluxo MVC: rota Express → middleware de acesso → controller → model/MySQL → template EJS → HTML entregue ao navegador.

## Permissões

| Recurso | Visitante | COMMON | ADMIN |
|---|---|---|---|
| Home, login e cadastro | Sim | Sim | Sim |
| Criar, consultar e excluir os próprios orçamentos | Não | Sim | Sim |
| Consultar perfil e trocar a própria senha | Não | Sim | Sim |
| Gerenciar produtos e fabricantes | Não | Não | Sim |
| Listar usuários, alterar papéis e excluir contas | Não | Não | Sim |

O cadastro público sempre cria `COMMON`, mesmo que a requisição tente enviar outro papel. O middleware consulta a conta e o papel no banco em cada requisição privada: revogações e exclusões passam a valer nas sessões existentes.

A gestão de usuários preserva o último administrador, impede excluir a própria conta e impede excluir contas com orçamentos. Seus formulários exigem token de sessão. Administradores também ficam restritos aos próprios orçamentos. Não há consulta global dos orçamentos de outros usuários.

## Executar com MySQL local

Na pasta que contém este `package.json`:

```bash
npm install
cp .env.example .env
```

Edite o `.env` com as credenciais locais e uma `SESSION_SECRET` própria. Gere a chave com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Depois:

```bash
npm run db:init
npm run dev
```

Abra http://localhost:3000 e cadastre uma conta. `db:init` cria o banco e as tabelas e exige permissão de criação de banco. Para inserir os 20 produtos demonstrativos e seus fabricantes, use `npm run db:seed` em um ambiente destinado a demonstração.

## Administrador inicial

Após cadastrar a conta, execute com o `.env` apontando para o banco desejado:

```bash
npm run user:role -- email@exemplo.com ADMIN
```

A inicialização adiciona a coluna `role` quando ausente, com `COMMON` como padrão. O comando também funciona com o Aiven e mantém a senha existente. `COMMON` remove a permissão pelo terminal; a proteção de último administrador é aplicada na interface web. Use o comando administrativo com cuidado.

## MySQL no Aiven e TLS

Para usar o banco já hospedado, configure:

```dotenv
DB_HOST=hostname-do-servico-aiven
DB_PORT=porta-do-servico
DB_NAME=defaultdb
DB_USER=usuario-do-servico
DB_PASSWORD=senha-do-servico
DB_SSL=true
```

Baixe o certificado CA do mesmo projeto Aiven. Localmente, salve `ca.pem` na raiz do projeto ou configure `DB_SSL_CA_PATH`. Como alternativa, `DB_SSL_CA` aceita o conteúdo completo do certificado, inclusive os delimitadores BEGIN/END CERTIFICATE. A verificação do certificado permanece ativa.

Com o banco existente e suas tabelas prontas, execute `npm start`. Não execute novamente a migração local→Aiven nem o seed como etapa de cada deploy.

## Publicar no Render

Crie um **Web Service** conectado ao repositório:

| Configuração | Valor |
|---|---|
| Language | Node |
| Branch | main |
| Root Directory | Pasta que contém o `package.json` do Express; vazio se estiver na raiz |
| Build Command | `npm install` |
| Start Command | `npm start` |

Em Environment, configure `NODE_ENV=production`, uma `SESSION_SECRET` estável e aleatória, todas as variáveis `DB_*` e `DB_SSL=true`. Cole o certificado inteiro em `DB_SSL_CA`, sem aspas adicionais. A aplicação utiliza a `PORT` fornecida pelo Render.

O MySQL no Aiven e o site no Render são serviços distintos. Atualizações locais exigem commit, push e novo deploy. As credenciais ficam no Environment do Render, não no repositório. Não publique `.env`, `.aiven-connection.json`, `.local-db-backup.json` nem `.env.local-backup`.

## Rotas principais

| Método e caminho | Acesso / operação |
|---|---|
| `GET /` | Página institucional pública |
| `GET/POST /login`, `GET/POST /register` | Acesso e cadastro públicos |
| `POST /logout` | Encerrar sessão |
| `GET /dashboard` | ADMIN: catálogo |
| `POST /dashboard/products` | ADMIN: criar produto |
| `POST /dashboard/products/:id/edit` | ADMIN: editar produto |
| `POST /dashboard/products/:id/delete` | ADMIN: excluir produto |
| `POST /dashboard/products/bulk-delete` | ADMIN: excluir seleção |
| `GET/POST /dashboard/producers` | ADMIN: listar/criar fabricantes |
| `POST /dashboard/producers/:id/edit` | ADMIN: edição disponível no servidor; sem input por linha |
| `POST /dashboard/producers/:id/delete` | ADMIN: excluir fabricante, preservando os produtos |
| `GET /dashboard/users` | ADMIN: listar usuários |
| `POST /dashboard/users/:id/role` | ADMIN: mudar papel |
| `POST /dashboard/users/:id/delete` | ADMIN: excluir conta permitida |
| `GET/POST /budgets` | Autenticado: listar/criar os próprios orçamentos |
| `POST /budgets/:id/delete` | Autenticado: excluir o próprio orçamento |
| `GET /profile`, `POST /profile/password` | Autenticado: perfil/senha |

## Banco de dados

As tabelas de negócio usam nomes definidos pelo Sequelize no ambiente atual, como `users`, `producers`, `products`, `budgets` e `budget_items`. `Sessions` armazena sessões. `registration_invites` é legado; o cadastro atual dispensa convite.

| Entidade | Dados e relacionamentos |
|---|---|
| User | UUID, e-mail único, hash da senha, papel e datas |
| Producer | UUID, nome único e datas; possui produtos |
| Product | Nome, categoria, tipo, NCM opcional, preço, status e fabricante opcional |
| Budget | Dono, título, status e total; pertence a um usuário |
| BudgetItem | Produto, nome e preço no momento da criação, quantidade, margem e total; pertence ao orçamento |

O orçamento é gravado em transação, com valores calculados pelo servidor a partir dos produtos ativos. Cadastro e edição de produtos compartilham validações. Erros de formulário retornam mensagens amigáveis; falhas inesperadas são tratadas por middleware global.

## Testes e aceite

```bash
npm test
```

Os testes exercitam os routers, middlewares, controllers, bcrypt e EJS com um adaptador de dados em memória. Incluem bloqueio de URLs administrativas, tentativa de elevar papel pelo cadastro, revogação de acesso, CRUD, orçamentos próprios, proteção do último administrador e validações. Não substituem testes contra o MySQL ou navegação visual em produção.

Veja [o relatório e roteiro de aceite](docs/verification.md) para os resultados e as verificações ainda pendentes em celulares e no site publicado.

## Entrega da extensão

Complementar com evidências reais da equipe: requisitos revisados da Fase 1, demanda da empresa parceira, contatos e feedbacks, ajustes implementados e impactos observados. Todos os integrantes precisam contribuir com commits e participar da demonstração e da explicação técnica. Esses registros não são produzidos automaticamente pelo sistema.

## Limites atuais

- A página pública é institucional; não há catálogo público de produtos.
- O formulário institucional de contato não possui integração de envio de e-mail.
- Orçamentos podem ser criados, listados e excluídos; edição e exportação PDF não estão implementadas nesta versão.
- O frontend usa Tailwind via CDN e precisa de acesso a esse recurso para renderizar todos os estilos.
