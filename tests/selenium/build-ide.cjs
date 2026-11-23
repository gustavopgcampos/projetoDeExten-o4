const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const command = (name, target = '', value = '') => ({ id: randomUUID(), comment: '', command: name, target, targets: [], value });
const login = () => [
    command('open', '/login'),
    command('type', 'name=email', '${commonEmail}'),
    command('type', 'name=password', '${commonPassword}'),
    command('click', 'css=form[action="/login"] button[type="submit"]'),
    command('waitForElementVisible', 'css=form[action="/budgets"]', '30000'),
];
const definitions = [
    ['IDE01 — Home pública', [command('open', '/'), command('waitForElementVisible', 'css=main h1', '30000'), command('assertText', 'css=main h1', 'Descubra o Futuro com a MMVL/Telecon')]],
    ['IDE02 — Visitante sem sessão', [command('open', '/login'), command('executeAsyncScript', 'return fetch("/logout", {method:"POST"}).then(() => true);', 'loggedOut'), command('open', '/budgets'), command('waitForElementVisible', 'css=form[action="/login"]', '30000'), command('assertElementPresent', 'name=password')]],
    ['IDE03 — Senha incorreta', [command('open', '/login'), command('type', 'name=email', 'selenium-invalid@example.com'), command('type', 'name=password', 'SenhaIncorreta123!'), command('click', 'css=form[action="/login"] button[type="submit"]'), command('waitForElementVisible', 'css=.border-red-500', '30000'), command('assertText', 'css=.border-red-500', 'E-mail ou senha inválidos.')]],
    ['IDE04 — Confirmação divergente', [command('open', '/register'), command('type', 'name=email', 'selenium-nao-criar@example.com'), command('type', 'name=password', 'Selenium123!'), command('type', 'name=confirmPassword', 'Diferente123!'), command('click', 'css=form[action="/register"] button.button'), command('waitForElementVisible', 'css=.border-red-500', '30000'), command('assertText', 'css=.border-red-500', 'A confirmação da senha não confere. Digite a mesma senha nos dois campos.')]],
    ['IDE05 — Campos obrigatórios', [command('open', '/login'), command('click', 'css=form[action="/login"] button[type="submit"]'), command('executeScript', 'return document.querySelector("[name=email]").validity.valueMissing;', 'missing'), command('assert', 'missing', 'true')]],
    ['IDE06 — Mostrar senha', [command('open', '/login'), command('waitForElementVisible', 'css=.password-toggle', '30000'), command('click', 'css=.password-toggle'), command('executeScript', 'return document.querySelector("[name=password]").type;', 'passwordType'), command('assert', 'passwordType', 'text'), command('click', 'css=.password-toggle'), command('executeScript', 'return document.querySelector("[name=password]").type;', 'passwordType'), command('assert', 'passwordType', 'password')]],
    ['IDE07 — Login COMMON', [command('store', 'SUBSTITUIR_EMAIL_CONTA_COMMON_TESTE', 'commonEmail'), command('store', 'SUBSTITUIR_SENHA_CONTA_COMMON_TESTE', 'commonPassword'), ...login(), command('assertElementPresent', 'css=form[action="/budgets"]')]],
    ...['/dashboard', '/dashboard/producers', '/dashboard/users'].map((url, i) => [`IDE${String(8 + i).padStart(2, '0')} — COMMON bloqueado em ${url}`, [command('open', url), command('waitForElementVisible', 'css=main h1', '30000'), command('assertText', 'css=main h1', 'Acesso restrito')]]),
    ['IDE11 — Logout', [command('open', '/budgets'), command('click', 'css=header .md\\:flex form[action="/logout"] button'), command('open', '/budgets'), command('waitForElementVisible', 'css=form[action="/login"]', '30000'), command('assertElementPresent', 'name=email')]],
];
const tests = definitions.map(([name, commands]) => ({ id: randomUUID(), name, commands }));
const project = {
    id: randomUUID(), version: '2.0', name: 'MMVL — Piloto Selenium IDE', url: 'http://localhost:3000',
    tests, suites: [{ id: randomUUID(), name: 'Piloto sequencial', persistSession: true, parallel: false, timeout: 120, tests: tests.map(t => t.id) }],
    urls: ['http://localhost:3000'], plugins: [],
};
fs.writeFileSync(path.join(__dirname, 'mmvl.side'), JSON.stringify(project, null, 4) + '\n');
console.log(`${tests.length} casos exportados para mmvl.side (sem credenciais reais).`);
