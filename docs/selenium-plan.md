# Plano de testes funcionais com Selenium

## Objetivo e referência

Aplicar os conceitos de teste funcional apresentados em `/home/gpereira/Desktop/Aula13.pdf`: partir dos requisitos, definir cenários e casos positivos/negativos, automatizar ações, adicionar pontos de verificação e registrar resultados com status passou/falhou/bloqueado.

Escopo: rotas públicas, cadastro/login/logout, autorização ADMIN/COMMON, catálogo, fabricantes, orçamentos, perfil, gestão de usuários e layout móvel. O Selenium observa a aplicação no navegador; não substitui testes de hash bcrypt, constraints SQL, carga, segurança completa ou avaliação em aparelho físico.

## Artefatos

| Arquivo | Finalidade |
|---|---|
| `test/selenium/run.cjs` | Suíte WebDriver JavaScript, com 28 casos e limpeza |
| `test/selenium/cases.json` | IDs, requisitos e resultados esperados |
| `docs/selenium-cases.md` | Pré-condições, procedimentos, pós-condições e status inicial de cada caso |
| `.env.selenium.example` | Configuração sem segredos |
| `test/selenium/bootstrap.cjs` | Cria uma conta ADMIN exclusiva para testes e salva configuração local |
| `test/selenium/artifacts/<execução>/` | Relatórios JSON/CSV e capturas; ignorados no Git |
| `docs/selenium-results.md` | Situação comprovada nesta entrega |

## Recursos e abordagem

Usar Node.js 20 ou superior, Chrome ou Firefox e acesso ao ambiente-alvo. O Selenium Manager do WebDriver pode baixar o driver compatível automaticamente; isso exige internet na primeira execução. Chrome é o padrão e pode ser substituído por Firefox na configuração. O endereço de um Selenium Grid é opcional; não é necessário montar Grid para a atividade.

As dependências Selenium ficam em `test/selenium/package.json`, separadas das dependências da aplicação. O primeiro install cria seu próprio package-lock.json; versioná-lo para repetir as mesmas versões. O `package-lock.json` principal não é alterado pela instalação de Selenium.

Esperas usam condições de URL, presença/visibilidade de elementos e mensagens. Não há sleeps fixos como critério de aprovação. O limite de cada espera é configurável; o carregamento da página tem limite de 90 segundos para acomodar inicialização do ambiente remoto.

Cada fluxo verifica resultados, não somente cliques. São usados `name`, `id`, seletores CSS de formulários e XPath de linhas que contêm os nomes exclusivos da execução. Alterações na interface podem exigir atualização dos seletores.

## Execução do WebDriver

Na raiz do `mmvl-express`:

```bash
npm install
npm run test:selenium:install
```

Há duas opções para configurar o administrador:

1. **Criar uma conta exclusiva:** com o `.env` da aplicação conectado ao banco-alvo e suas tabelas existentes, executar `npm run test:selenium:setup`. Isso cria somente uma nova conta ADMIN de teste e gera `.env.selenium` com senha aleatória. Não altera contas existentes. A conta permanece para futuras execuções.
2. **Usar uma conta ADMIN de teste existente:** copiar `.env.selenium.example` para `.env.selenium` e preencher `SELENIUM_ADMIN_EMAIL` e `SELENIUM_ADMIN_PASSWORD`. O comando setup não sobrescreve arquivo existente.

Para testar localmente, iniciar a aplicação em outro terminal com `npm run dev`. Com a aplicação disponível em http://localhost:3000:

O `nodemon.json` monitora somente `src` e `public`. Os relatórios JSON do Selenium em `test/selenium/artifacts` não podem reiniciar o servidor a cada caso. Depois de adicionar ou modificar essa configuração, encerre e inicie novamente `npm run dev`. Como alternativa, `npm start` executa o servidor sem reinicialização automática durante a demonstração.

```bash
npm run test:selenium
```

Para testar o site no Render, editar `.env.selenium`:

```dotenv
SELENIUM_BASE_URL=https://projetodeexten-o4.onrender.com
SELENIUM_ALLOW_REMOTE=true
SELENIUM_ADMIN_EMAIL=email-da-conta-admin-de-teste
SELENIUM_ADMIN_PASSWORD=senha-da-conta-admin-de-teste
SELENIUM_BROWSER=chrome
SELENIUM_HEADLESS=false
SELENIUM_TIMEOUT=60000
```

A aplicação nesse endereço precisa usar o mesmo banco em que a conta de teste foi criada. A ativação remota autoriza que a suíte cadastre produtos, fabricantes, contas e orçamentos temporários. Os testes nunca alteram o papel ou a senha do administrador fornecido.

`SELENIUM_HEADLESS=false` abre as janelas para acompanhar a demonstração. `true` executa sem janela visível. `SELENIUM_CHROME_BINARY` permite indicar Chrome/Brave fora do caminho padrão. Em sistemas com política restritiva que bloqueie driver, sockets ou navegador, a execução pode ficar bloqueada; isso não significa que os requisitos funcionais falharam.

## Ordem e dados de teste

CT01–CT11: público e autenticação. CT12–CT17: administração e catálogo. CT18–CT23: orçamento, isolamento e perfil. CT24–CT26: papéis e exclusão de conta. CT27: tamanhos de janela. CT28: limpeza.

Os três navegadores mantêm sessões separadas para ADMIN, COMMON e segunda conta. Casos dependentes são bloqueados quando a preparação falha. Usuários comuns temporários têm e-mails únicos; produto, fabricante e orçamento usam o prefixo exclusivo da execução. A limpeza tenta remover somente esses nomes, primeiro orçamento, depois produto/fabricante e por último contas. Em falha, consultar `cleanup` no relatório antes de remover manualmente dados remanescentes. Encerrar abruptamente o processo ou fechar o computador pode impedir a limpeza.

A proteção do último administrador já é coberta pelos testes isolados (`npm test`). Não é automatizada no Selenium contra produção, pois fabricar essa pré-condição exigiria alterar os administradores reais. Os testes de papel promovem/rebaixam apenas a conta criada pela execução. A hash bcrypt também é verificada nos testes existentes, não pela leitura da tela.

## Critérios e métricas

- **Passou:** todas as verificações do caso coincidiram com o resultado esperado.
- **Falhou:** verificação ou interação falhou após iniciar o caso; analisar screenshot e detalhe para distinguir defeito da aplicação de problema no seletor/ambiente.
- **Bloqueado:** pré-condição, credenciais, dependência, navegador ou ambiente indisponível.
- Métricas: casos planejados = 28; executados = passou + falhou; bloqueados separados; taxa de aprovação = passou / executados, somente se executados > 0.
- Aprovação da suíte: 28 passaram e nenhuma limpeza pendente. Um resultado bloqueado nunca é contado como aprovado.

O processo retorna código 1 se houver falhas, bloqueios ou limpeza pendente. `results.json` e `results.csv` guardam IDs, requisitos, status e horários. Falhas geram screenshots quando o navegador está disponível; CT27 registra capturas móveis. Evidências podem conter e-mails/dados de teste: revisar antes de compartilhar.

## Responsabilidade e entrega acadêmica

A equipe deve escolher responsáveis por preparar o ambiente, executar, revisar falhas e consolidar as evidências; não foram atribuídos nomes fictícios. Guardar plano, casos, scripts no repositório e anexar resultados reais de execução à entrega. Não atribuir aprovação a casos que apenas foram escritos ou revisados.

## Fontes

- Material fornecido: Aula13.pdf — Qualidade de Software, professor Zady Castaneda Salazar.
- https://www.selenium.dev/documentation/ide/
- https://www.selenium.dev/downloads/
- https://www.selenium.dev/documentation/webdriver/getting_started/
- https://www.selenium.dev/selenium-ide/docs/en/api/commands/
