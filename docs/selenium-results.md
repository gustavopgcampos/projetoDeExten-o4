# Resultados dos testes Selenium WebDriver

A suíte JavaScript contém 28 casos automáticos. Os relatórios locais abaixo registram execuções concluídas, realizadas pelo usuário, com todos os casos aprovados.

| Ambiente | Execução | Passaram | Falharam | Bloqueados |
|---|---|---|---|---|
| Local (`http://localhost:3000`) | `SELENIUM-1795396885280-0118f7` | 28 | 0 | 0 |
| Render (`https://projetodeexten-o4.onrender.com`) | `SELENIUM-1795397992887-11bd19` | 28 | 0 | 0 |

As duas execuções ocorreram em 23/11/2026 (UTC) e registraram a limpeza concluída dos dados temporários. Os arquivos completos estão em `test/selenium/artifacts/<execução>/results.json`, acompanhados de CSV e capturas quando geradas. Os artefatos são locais e ignorados pelo Git.

A suíte cobre cadastro, login/logout, validações, catálogo, fabricantes, orçamentos, isolamento entre contas, perfil, gestão de usuários, mudanças de papel em sessão aberta, invalidação de sessão de conta excluída, responsividade e limpeza. CT24 e CT26 são automáticos, com sessões separadas para ADMIN e usuários comuns.

## Executar novamente

Na pasta `mmvl-express`, usar `npm run test:selenium`. A configuração fica em `.env.selenium`; o plano e as pré-condições estão em [selenium-plan.md](selenium-plan.md), e os procedimentos de cada caso em [selenium-cases.md](selenium-cases.md).

Cada execução gera seu próprio relatório. Os resultados acima são históricos e não comprovam execuções futuras ou versões posteriores da aplicação. `npm test` executa testes locais isolados e não substitui uma execução de navegador.
