const fs = require('node:fs');
const path = require('node:path');
const cases = require('./cases.json');
const details = {
    CT01: ['Sem sessão.', 'Abrir / e conferir logo e título institucional.', 'Nenhuma gravação.'],
    CT02: ['Sem sessão.', 'Abrir /budgets, /profile, /dashboard, /dashboard/producers e /dashboard/users.', 'Permanece sem autenticação.'],
    CT03: ['E-mail exclusivo da execução.', 'Preencher cadastro; senha válida e confirmação Diferente123!; enviar.', 'Conta não deve ser criada.'],
    CT04: ['CT03 passou.', 'Repetir cadastro com o mesmo e-mail exclusivo e senhas iguais.', 'Conta COMMON temporária criada.'],
    CT05: ['CT04 passou.', 'Enviar novo cadastro com o e-mail já criado e senhas iguais.', 'Conta original preservada.'],
    CT06: ['CT04 passou.', 'Abrir login, informar e-mail criado e Errada123!, enviar.', 'Login inválido não concede acesso.'],
    CT07: ['Página de login acessível.', 'Enviar formulário com e-mail vazio e consultar validity.valueMissing.', 'Navegador bloqueia envio.'],
    CT08: ['Script de visibilidade carregado.', 'Clicar no olho duas vezes; verificar atributo type do campo.', 'Campo retorna ao tipo password.'],
    CT09: ['Conta COMMON temporária criada.', 'Preencher login com e-mail e senha gerados.', 'Sessão COMMON ativa.'],
    CT10: ['CT09 passou.', 'Abrir diretamente as três páginas administrativas.', 'Sessão COMMON continua sem acesso administrativo.'],
    CT11: ['Conta COMMON autenticada.', 'Clicar Sair e tentar abrir /budgets.', 'Sessão encerrada.'],
    CT12: ['Conta ADMIN de teste configurada.', 'Abrir segundo navegador e efetuar login administrativo.', 'Sessão ADMIN separada da sessão COMMON.'],
    CT13: ['CT12 passou.', 'Abrir fabricantes; expandir Adicionar fabricante; informar nome SELENIUM exclusivo e salvar.', 'Fabricante temporário criado.'],
    CT14: ['CT13 passou.', 'Repetir o nome do fabricante temporário.', 'Fabricante não é duplicado.'],
    CT15: ['CT13 passou.', 'Abrir modal Adicionar; preencher produto exclusivo, tipo Cat6, preço 10 e fabricante temporário; salvar.', 'Produto temporário criado.'],
    CT16: ['CT15 passou.', 'Abrir cadastro e edição; informar 0; verificar rangeUnderflow. Desativar noValidate apenas para essa submissão de teste e enviar para verificar também a validação do servidor.', 'Produto original mantém preço válido; nenhum produto zero deve ser gravado.'],
    CT17: ['CT15 passou.', 'Editar tipo para Cat6 atualizado; salvar; atualizar página; localizar linha.', 'Produto temporário atualizado.'],
    CT18: ['CT04 e CT15 passaram.', 'Entrar como COMMON; adicionar linha de orçamento; digitar o nome do produto e escolher valor correspondente do datalist.', 'Produto válido selecionado.'],
    CT19: ['CT18 passou.', 'Informar quantidade 2 e margem 10; ler total exibido.', 'Rascunho com total R$ 22,00, ainda não salvo.'],
    CT20: ['CT19 passou.', 'Informar título exclusivo; salvar; atualizar página e ler histórico.', 'Orçamento temporário persistido.'],
    CT21: ['CT20 passou.', 'Cadastrar segunda conta; consultar histórico; tentar POST de exclusão do orçamento da primeira conta usando formulário temporário no navegador; conferir original.', 'Orçamento original preservado; segunda conta temporária criada.'],
    CT22: ['Conta COMMON ativa.', 'Adicionar item; escrever produto inexistente; consultar validity.customError.', 'Envio bloqueado sem orçamento inválido.'],
    CT23: ['Conta COMMON temporária existe.', 'No perfil, tentar confirmação divergente; conferir mensagem. Depois salvar senha nova válida e efetuar login com ela.', 'Somente senha da conta temporária é alterada.'],
    CT24: ['CT12 e CT04 passaram.', 'ADMIN promove conta temporária; na sessão COMMON já aberta tentar dashboard. ADMIN rebaixa conta e a mesma sessão tenta novamente.', 'Conta temporária retorna a COMMON.'],
    CT25: ['CT12 e CT20 passaram.', 'ADMIN tenta excluir a primeira conta temporária; aceitar confirmação e conferir mensagem e linha preservada.', 'Conta e orçamento são preservados.'],
    CT26: ['CT12 e CT21 passaram.', 'ADMIN exclui a segunda conta temporária sem orçamento; tentar /budgets na sessão dessa conta.', 'Conta secundária removida; sessão deixa de conceder acesso.'],
    CT27: ['Sessões ADMIN e COMMON ativas.', 'Redimensionar janelas para 320, 390 e 768; abrir orçamento/perfil/catálogo/fabricantes/usuários; medir overflow global e conferir menu móvel abaixo de 768; salvar capturas.', 'Janelas retornam a desktop; registros permanecem para limpeza.'],
    CT28: ['CT12 passou.', 'Excluir orçamento, produto e fabricante exclusivos; excluir contas temporárias sem orçamento. Conferir ausência das linhas.', 'Conta ADMIN fornecida para os testes permanece; demais registros devem ser removidos.'],
};
const intro = `# Casos de teste funcionais — MMVL Telecon\n\nBase: Aula13.pdf (Qualidade de Software), requisitos do sistema e regras implementadas.\n\nTodos os casos são funcionais de caixa-preta. Dados são gerados por execução com prefixo SELENIUM e e-mails exclusivos; senhas ficam somente em memória ou .env.selenium. O status real vem de results.json, nunca desta especificação. Dependência que falhou marca o caso subsequente como bloqueado.\n\n`;
const sections = cases.map(c => {
    const [pre, steps, post] = details[c.id];
    return `## ${c.id} — ${c.name}\n\n- Requisito: ${c.requirement}.\n- Pré-condições: ${pre}\n- Procedimento: ${steps}\n- Resultado esperado: ${c.expected}\n- Pós-condições: ${post}\n- Status nesta entrega: bloqueado no navegador; consultar o relatório de execução.\n`;
});
fs.writeFileSync(path.resolve(__dirname, '../../docs/selenium-cases.md'), intro + sections.join('\n'));
console.log('Casos detalhados gerados em docs/selenium-cases.md.');
