const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../tests/selenium');
const { rowXPath } = require('../tests/selenium/selectors.cjs');

test('JavaScript enviado ao navegador tem sintaxe válida, inclusive CT22', () => {
    const runner = fs.readFileSync(path.join(root, 'run.cjs'), 'utf8');
    const snippets = [...runner.matchAll(/executeScript\(('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)];

    assert.ok(snippets.length >= 5);

    for (const [, literal] of snippets) {
        const script = vm.runInNewContext(literal);

        assert.doesNotThrow(() => new vm.Script('(function () { ' + script + '\n})'), script);
    }
});

test('localização de registros não pressupõe nome na coluna do checkbox', () => {
    const locator = rowXPath('SELENIUM-TESTE-PRODUTO');

    assert.equal(locator, "//tbody/tr[td[normalize-space(.)='SELENIUM-TESTE-PRODUTO']]");
    assert.ok(!locator.includes('td[1]'));
    assert.ok(!locator.includes('contains('), 'Limpeza deve procurar o nome exato');
});

test('casos que precisam da conta COMMON restabelecem o login após o teste de logout', () => {
    const runner = fs.readFileSync(path.join(root, 'run.cjs'), 'utf8');

    for (const id of ['CT22', 'CT23', 'CT24', 'CT27']) {
        const start = runner.indexOf(`await test('${id}'`);
        const end = runner.indexOf('await test(', start + 1);
        const body = runner.slice(start, end < 0 ? undefined : end);

        assert.ok(body.includes("await login(mainBrowser, state.email, state.password, '/budgets')"), id);
    }
});

test('catálogo de Selenium possui IDs únicos e todos têm implementação', () => {
    const cases = require('../tests/selenium/cases.json');
    const runner = fs.readFileSync(path.join(root, 'run.cjs'), 'utf8');
    assert.equal(cases.length, 28);
    assert.equal(new Set(cases.map(c => c.id)).size, cases.length);
    for (const entry of cases) {
        assert.ok(entry.expected && entry.requirement && entry.name);
        assert.ok(runner.includes(`test('${entry.id}'`), entry.id);
    }
    new vm.Script(runner);
});

test('projeto IDE referencia casos existentes e não contém credenciais reais', () => {
    const project = JSON.parse(fs.readFileSync(path.join(root, 'mmvl.side'), 'utf8'));
    const ids = new Set(project.tests.map(t => t.id));
    assert.equal(ids.size, 11);
    for (const suite of project.suites) for (const id of suite.tests) assert.ok(ids.has(id));
    assert.ok(project.tests.every(t => t.commands.some(c => c.command.startsWith('assert'))));
    const sample = project.tests.flatMap(t => t.commands).find(c => c.command === 'store' && c.value === 'commonPassword');
    assert.equal(sample.target, 'SUBSTITUIR_SENHA_CONTA_COMMON_TESTE');
});
