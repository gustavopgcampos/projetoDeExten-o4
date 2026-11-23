/* Testes de caixa-preta: interações WebDriver e leitura do DOM, sem acesso ao MySQL. */
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env.selenium') });
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const cases = require('./cases.json');
const { xpathText, rowXPath } = require('./selectors.cjs');

const runId = `SELENIUM-${Date.now()}-${randomUUID().slice(0, 6)}`;
const artifactDir = path.join(__dirname, 'artifacts', runId);
fs.mkdirSync(artifactDir, { recursive: true });
const report = { runId, startedAt: new Date().toISOString(), baseUrl: process.env.SELENIUM_BASE_URL || 'http://localhost:3000', cases: [], cleanup: [] };
const results = new Map();
const state = { producer: runId, product: runId + '-PRODUTO', budget: runId + '-ORCAMENTO', password: 'Selenium-' + randomUUID(), email: `selenium-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`, otherEmail: `selenium-other-${Date.now()}-${randomUUID().slice(0, 6)}@example.com` };
const browsers = [];
let selenium, By, until, mainBrowser, adminBrowser, otherBrowser;
const timeout = Number(process.env.SELENIUM_TIMEOUT || 30000);
const stepDelay = Math.max(0, Number(process.env.SELENIUM_STEP_DELAY) || 0);
const pause = () => new Promise(resolve => setTimeout(resolve, stepDelay));
const base = report.baseUrl.replace(/\/$/, '');

function save() {
    report.finishedAt = new Date().toISOString();
    report.totals = Object.fromEntries(['passou', 'falhou', 'bloqueado'].map(status => [status, report.cases.filter(c => c.status === status).length]));
    fs.writeFileSync(path.join(artifactDir, 'results.json'), JSON.stringify(report, null, 4));
    const rows = report.cases.map(c => `${c.id},${c.status},${JSON.stringify(c.name)},${JSON.stringify(c.detail || '')}`);
    fs.writeFileSync(path.join(artifactDir, 'results.csv'), ['ID,Status,Caso,Detalhe', ...rows].join('\n') + '\n');
}
function safeMessage(error) {
    let message = String(error.message || error).split('\n')[0];
    for (const secret of [state.password, process.env.SELENIUM_ADMIN_PASSWORD]) if (secret) message = message.split(secret).join('[oculto]');
    return message.slice(0, 500);
}
async function test(id, prerequisites, action) {
    const spec = cases.find(c => c.id === id);
    const result = { ...spec, startedAt: new Date().toISOString() };
    report.cases.push(result);
    const missing = prerequisites.filter(p => results.get(p) !== 'passou');
    if (missing.length) {
        result.status = 'bloqueado'; result.detail = 'Pré-condições não atendidas: ' + missing.join(', ');
    } else {
        try { await action(); result.status = 'passou'; }
        catch (error) {
            result.status = 'falhou'; result.detail = safeMessage(error);
            result.observed = [];
            for (const [index, browser] of browsers.entries()) {
                try {
                    result.observed.push({
                        browser: index,
                        url: await browser.getCurrentUrl(),
                        title: await browser.getTitle(),
                        page: await browser.executeScript('return (document.querySelector("main")?.innerText || "").slice(0, 1500)'),
                        notices: await browser.executeScript('return [...document.querySelectorAll("[data-testid^=flash], [role=alert], [role=status]")].map(x => x.innerText)'),
                    });
                } catch {}
                try { fs.writeFileSync(path.join(artifactDir, `${id}-${index}.png`), await browser.takeScreenshot(), 'base64'); } catch {}
            }
        }
    }
    results.set(id, result.status);
    console.log(`${id}: ${result.status}${result.detail ? ' — ' + result.detail : ''}`);
    save();
}
async function browser() {
    const name = process.env.SELENIUM_BROWSER || 'chrome';
    let builder = new selenium.Builder().forBrowser(name);
    if (process.env.SELENIUM_GRID_URL) builder = builder.usingServer(process.env.SELENIUM_GRID_URL);
    if (name === 'chrome') {
        const { Options } = require('selenium-webdriver/chrome');
        const options = new Options().addArguments('--window-size=1366,900');
        if (process.env.SELENIUM_HEADLESS !== 'false') options.addArguments('--headless=new');
        if (process.env.SELENIUM_CHROME_BINARY) options.setChromeBinaryPath(process.env.SELENIUM_CHROME_BINARY);
        builder.setChromeOptions(options);
    } else if (name === 'firefox') {
        const { Options } = require('selenium-webdriver/firefox');
        const options = new Options();
        if (process.env.SELENIUM_HEADLESS !== 'false') options.addArguments('-headless');
        builder.setFirefoxOptions(options);
    }
    const driver = await builder.build(); browsers.push(driver);
    await driver.manage().setTimeouts({ pageLoad: 90000, script: timeout, implicit: 0 });
    await driver.manage().window().setRect({ width: 1366, height: 900 });
    return driver;
}
async function visible(driver, selector) {
    const element = await driver.wait(until.elementLocated(By.css(selector)), timeout);
    await driver.wait(until.elementIsVisible(element), timeout);
    return element;
}
async function click(driver, selector) {
    await clickElement(driver, await visible(driver, selector));
}
async function clickElement(driver, element) {
    await driver.executeScript('arguments[0].scrollIntoView({block:"center",inline:"center",behavior:"instant"});', element);
    await driver.wait(until.elementIsVisible(element), timeout);
    await element.click();
    await pause();
}
async function type(driver, selector, value) {
    const element = await visible(driver, selector);
    await element.clear();
    await element.sendKeys(String(value));
    await pause();
    return element;
}
async function open(driver, route) {
    await driver.get(base + route);
    await pause();
}
async function route(driver, pathname) { await driver.wait(async () => new URL(await driver.getCurrentUrl()).pathname === pathname, timeout); }
async function message(driver, fragment, success = false) {
    const element = await visible(driver, success ? '[data-testid="flash-success"]' : '[data-testid="flash-error"]');
    assert.ok((await element.getText()).includes(fragment), 'Mensagem esperada: ' + fragment);
}
async function login(driver, email, password, expected) {
    await open(driver, '/login'); await type(driver, '[name=email]', email); await type(driver, '[name=password]', password);
    await click(driver, 'form[action="/login"] button[type=submit]');
    if (expected) await route(driver, expected);
}
async function register(driver, email, confirmation = state.password) {
    await open(driver, '/register'); await type(driver, '[name=email]', email);
    await type(driver, '[name=password]', state.password); await type(driver, '[name=confirmPassword]', confirmation);
    await click(driver, 'form[action="/register"] button.button');
}
async function row(driver, name) { return driver.wait(until.elementLocated(By.xpath(rowXPath(name))), timeout); }
async function absentRow(driver, name) { await driver.wait(async () => (await driver.findElements(By.xpath(rowXPath(name)))).length === 0, timeout); }
async function choose(element, value) { await element.findElement(By.css(`option[value="${value}"]`)).click(); }
async function confirm(driver) { await driver.wait(until.alertIsPresent(), timeout); await (await driver.switchTo().alert()).accept(); }
async function deleteRow(driver, name) {
    const entry = await row(driver, name);
    await clickElement(driver, await entry.findElement(By.css('form[action$="/delete"] button'))); await confirm(driver);
}
async function budgetArticle(driver) { return driver.wait(until.elementLocated(By.xpath(`//article[.//h3[normalize-space(.)=${xpathText(state.budget)}]]`)), timeout); }
async function productModal(edit = false) {
    await open(adminBrowser, '/dashboard');
    if (edit) await (await row(adminBrowser, state.product)).findElement(By.css('button[onclick^="editProduct"]')).click();
    else await click(adminBrowser, 'button[onclick="openProductModal()"]');
    await visible(adminBrowser, '#product-form');
}
async function fillProduct(value) {
    await type(adminBrowser, '#productName', state.product); await type(adminBrowser, '#detail', 'Cat6 de teste');
    await type(adminBrowser, '#unitValue', value);
    const selector = await visible(adminBrowser, '#producerId');
    const options = await selector.findElements(By.css('option'));
    for (const option of options) if ((await option.getText()).trim() === state.producer) { await option.click(); return; }
    throw Error('Fabricante de teste não encontrado');
}
async function roleChange(role) {
    await open(adminBrowser, '/dashboard/users');
    const entry = await row(adminBrowser, state.email);
    await choose(await entry.findElement(By.css('select[name=role]')), role);
    await entry.findElement(By.css('form[action$="/role"] button')).click();
    await message(adminBrowser, 'Permissão do usuário atualizada', true);
}
async function cleanup() {
    if (!adminBrowser) return;
    const attempt = async (label, fn) => { try { await fn(); report.cleanup.push({ item: label, status: 'concluído' }); } catch (error) { report.cleanup.push({ item: label, status: 'pendente', detail: safeMessage(error) }); } };
    // Only exact run-specific names are eligible for cleanup.
    await attempt('orçamento de teste', async () => {
        if (!state.budgetCreated || state.budgetDeleted) return;
        await roleChange('COMMON');
        await login(mainBrowser, state.email, state.password, '/budgets');
        await (await budgetArticle(mainBrowser)).findElement(By.css('button')).click();
        await message(mainBrowser, 'Orçamento excluído', true); state.budgetDeleted = true;
    });
    await attempt('produto de teste', async () => {
        if (state.productDeleted) return;
        await open(adminBrowser, '/dashboard');
        if (!(await adminBrowser.findElements(By.xpath(rowXPath(state.product)))).length) return;
        await open(adminBrowser, '/dashboard'); await deleteRow(adminBrowser, state.product); await absentRow(adminBrowser, state.product); state.productDeleted = true;
    });
    await attempt('fabricante de teste', async () => {
        if (state.producerDeleted) return;
        await open(adminBrowser, '/dashboard/producers');
        if (!(await adminBrowser.findElements(By.xpath(rowXPath(state.producer)))).length) return;
        await open(adminBrowser, '/dashboard/producers'); await deleteRow(adminBrowser, state.producer); await absentRow(adminBrowser, state.producer); state.producerDeleted = true;
    });
    for (const address of [state.email, state.otherEmail]) await attempt('conta de teste ' + address, async () => {
        await open(adminBrowser, '/dashboard/users');
        const entries = await adminBrowser.findElements(By.xpath(rowXPath(address)));
        if (!entries.length) return;
        await deleteRow(adminBrowser, address); await absentRow(adminBrowser, address);
    });
}

async function main() {
    const target = new URL(base);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) && process.env.SELENIUM_ALLOW_REMOTE !== 'true') throw Error('Configure SELENIUM_ALLOW_REMOTE=true para testar o ambiente remoto com gravação de dados.');
    if (!process.env.SELENIUM_ADMIN_EMAIL || !process.env.SELENIUM_ADMIN_PASSWORD) throw Error('Configure uma conta ADMIN de teste em .env.selenium.');
    selenium = require('selenium-webdriver'); ({ By, until } = selenium);
    mainBrowser = await browser();
    await test('CT01', [], async () => { await open(mainBrowser, '/'); await visible(mainBrowser, 'img[alt="MMVL Telecon Logo"]'); assert.ok((await mainBrowser.findElement(By.css('main')).getText()).includes('Descubra o Futuro')); });
    await test('CT02', [], async () => { for (const url of ['/budgets', '/profile', '/dashboard', '/dashboard/producers', '/dashboard/users']) { await open(mainBrowser, url); await route(mainBrowser, '/login'); } });
    await test('CT03', [], async () => { await register(mainBrowser, state.email, 'Diferente123!'); await message(mainBrowser, 'confirmação da senha não confere'); await route(mainBrowser, '/register'); });
    await test('CT04', ['CT03'], async () => { await register(mainBrowser, state.email); await route(mainBrowser, '/budgets'); state.commonCreated = true; });
    await test('CT05', ['CT04'], async () => { await register(mainBrowser, state.email); await message(mainBrowser, 'e-mail já está cadastrado'); });
    await test('CT06', ['CT04'], async () => { await login(mainBrowser, state.email, 'Errada123!'); await message(mainBrowser, 'E-mail ou senha inválidos'); });
    await test('CT07', [], async () => { await open(mainBrowser, '/login'); await click(mainBrowser, 'form button[type=submit]'); assert.equal(await mainBrowser.executeScript('return document.querySelector("[name=email]").validity.valueMissing'), true); await route(mainBrowser, '/login'); });
    await test('CT08', [], async () => { await open(mainBrowser, '/login'); await visible(mainBrowser, '.password-toggle'); await click(mainBrowser, '.password-toggle'); assert.equal(await mainBrowser.findElement(By.name('password')).getAttribute('type'), 'text'); await click(mainBrowser, '.password-toggle'); assert.equal(await mainBrowser.findElement(By.name('password')).getAttribute('type'), 'password'); });
    await test('CT09', ['CT04'], async () => { await login(mainBrowser, state.email, state.password, '/budgets'); });
    await test('CT10', ['CT09'], async () => { for (const url of ['/dashboard', '/dashboard/producers', '/dashboard/users']) { await open(mainBrowser, url); assert.ok((await mainBrowser.findElement(By.css('main')).getText()).includes('Acesso restrito')); } });
    await test('CT11', ['CT09'], async () => { await open(mainBrowser, '/budgets'); await click(mainBrowser, 'form[action="/logout"] button'); await route(mainBrowser, '/'); await open(mainBrowser, '/budgets'); await route(mainBrowser, '/login'); });
    await test('CT12', [], async () => { adminBrowser = await browser(); await login(adminBrowser, process.env.SELENIUM_ADMIN_EMAIL, process.env.SELENIUM_ADMIN_PASSWORD, '/dashboard'); });
    await test('CT13', ['CT12'], async () => { await open(adminBrowser, '/dashboard/producers'); await click(adminBrowser, 'main details summary'); await type(adminBrowser, 'input[name=name]', state.producer); await click(adminBrowser, 'form[action="/dashboard/producers"] button'); await message(adminBrowser, 'Fabricante cadastrado', true); await row(adminBrowser, state.producer); state.producerCreated = true; });
    await test('CT14', ['CT13'], async () => { await click(adminBrowser, 'main details summary'); await type(adminBrowser, 'input[name=name]', state.producer); await click(adminBrowser, 'form[action="/dashboard/producers"] button'); await message(adminBrowser, 'Já existe um cadastro'); });
    await test('CT15', ['CT13'], async () => { await productModal(); await fillProduct('10'); await click(adminBrowser, '#product-form button[type=submit], #product-form button:not([type])'); await message(adminBrowser, 'Produto cadastrado', true); const entry = await row(adminBrowser, state.product); assert.ok((await entry.getText()).includes(state.producer)); state.productCreated = true; });
    await test('CT16', ['CT15'], async () => { for (const edit of [false, true]) { await productModal(edit); await fillProduct('0'); assert.equal(await adminBrowser.executeScript('return document.querySelector("#unitValue").validity.rangeUnderflow'), true); await adminBrowser.executeScript('document.querySelector("#product-form").noValidate = true'); await click(adminBrowser, '#product-form button:not([type])'); await message(adminBrowser, 'maior que zero'); } });
    await test('CT17', ['CT15'], async () => { await productModal(true); await type(adminBrowser, '#detail', 'Cat6 atualizado'); await click(adminBrowser, '#product-form button:not([type])'); await message(adminBrowser, 'Produto atualizado', true); await adminBrowser.navigate().refresh(); assert.ok((await (await row(adminBrowser, state.product)).getText()).includes('Cat6 atualizado')); });
    await test('CT18', ['CT15', 'CT04'], async () => { await login(mainBrowser, state.email, state.password, '/budgets'); await click(mainBrowser, 'button[onclick="addBudgetItem()"]'); const input = await type(mainBrowser, '[aria-label="Pesquisar produto"]', state.product); const option = await mainBrowser.findElement(By.css('#budget-product-options option[value^="' + state.product + '"]')); await input.clear(); await input.sendKeys(await option.getAttribute('value')); });
    await test('CT19', ['CT18'], async () => { await type(mainBrowser, '[aria-label="Quantidade"]', '2'); await type(mainBrowser, '[aria-label="Margem percentual"]', '10'); assert.match(await (await visible(mainBrowser, '#budget-items [aria-live]')).getText(), /22,00/); });
    await test('CT20', ['CT19'], async () => { await type(mainBrowser, '[name=title]', state.budget); await click(mainBrowser, 'form[action="/budgets"] button:not([type])'); await message(mainBrowser, 'Orçamento criado', true); state.budgetCreated = true; await mainBrowser.navigate().refresh(); const article = await budgetArticle(mainBrowser); assert.match(await article.getText(), /22,00/); state.budgetDeletePath = await article.findElement(By.css('form[action$="/delete"]')).getAttribute('action'); });
    await test('CT21', ['CT20'], async () => { otherBrowser = await browser(); await register(otherBrowser, state.otherEmail); await route(otherBrowser, '/budgets'); state.otherCreated = true; assert.ok(!(await otherBrowser.findElement(By.css('main')).getText()).includes(state.budget)); await otherBrowser.executeScript('const f=document.createElement("form");f.method="post";f.action=arguments[0];document.body.append(f);f.submit();', state.budgetDeletePath); await route(otherBrowser, '/budgets'); await message(otherBrowser, 'Orçamento não encontrado'); await mainBrowser.navigate().refresh(); await budgetArticle(mainBrowser); });
    await test('CT22', ['CT04'], async () => {
        await login(mainBrowser, state.email, state.password, '/budgets');
        await click(mainBrowser, 'button[onclick="addBudgetItem()"]');
        const input = await type(mainBrowser, '[aria-label="Pesquisar produto"]', runId + '-INEXISTENTE');
        const invalidProduct = await mainBrowser.executeScript('return arguments[0].validity.customError;', input);

        assert.equal(invalidProduct, true);
    });
    await test('CT23', ['CT04'], async () => { await login(mainBrowser, state.email, state.password, '/budgets'); await open(mainBrowser, '/profile'); await type(mainBrowser, '[name=currentPassword]', state.password); const updated = state.password + '-nova'; await type(mainBrowser, '[name=newPassword]', updated); await type(mainBrowser, '[name=confirmPassword]', 'NaoConfere123!'); await click(mainBrowser, 'form[action="/profile/password"] button'); await message(mainBrowser, 'confirmação da senha não confere'); await type(mainBrowser, '[name=currentPassword]', state.password); await type(mainBrowser, '[name=newPassword]', updated); await type(mainBrowser, '[name=confirmPassword]', updated); await click(mainBrowser, 'form[action="/profile/password"] button'); await message(mainBrowser, 'Senha alterada', true); state.password = updated; await login(mainBrowser, state.email, state.password, '/budgets'); });
    await test('CT24', ['CT12', 'CT04'], async () => { await login(mainBrowser, state.email, state.password, '/budgets'); await roleChange('ADMIN'); await open(mainBrowser, '/dashboard'); await visible(mainBrowser, 'button[onclick="openProductModal()"]'); await roleChange('COMMON'); await open(mainBrowser, '/dashboard'); assert.ok((await mainBrowser.findElement(By.css('main')).getText()).includes('Acesso restrito')); });
    await test('CT25', ['CT12', 'CT20'], async () => { await open(adminBrowser, '/dashboard/users'); await deleteRow(adminBrowser, state.email); await message(adminBrowser, 'possui orçamentos'); await row(adminBrowser, state.email); });
    await test('CT26', ['CT12', 'CT21'], async () => { await open(adminBrowser, '/dashboard/users'); await deleteRow(adminBrowser, state.otherEmail); await absentRow(adminBrowser, state.otherEmail); await open(otherBrowser, '/budgets'); await route(otherBrowser, '/login'); });
    await test('CT27', ['CT12', 'CT04'], async () => {
        await roleChange('COMMON');
        await login(mainBrowser, state.email, state.password, '/budgets');
        for (const width of [320, 390, 768]) {
            await mainBrowser.manage().window().setRect({ width, height: 844 });
            for (const url of ['/budgets', '/profile']) {
                await open(mainBrowser, url);
                assert.equal(await mainBrowser.executeScript('return document.documentElement.scrollWidth <= innerWidth + 1'), true, `Overflow ${width} ${url}`);
            }
            if (width < 768) { await click(mainBrowser, '#site-header summary'); await visible(mainBrowser, '#site-header details[open] a[href="/budgets"]'); }
            await adminBrowser.manage().window().setRect({ width, height: 844 });
            for (const url of ['/dashboard', '/dashboard/users', '/dashboard/producers']) { await open(adminBrowser, url); assert.equal(await adminBrowser.executeScript('return document.documentElement.scrollWidth <= innerWidth + 1'), true, `Overflow admin ${width} ${url}`); }
            await adminBrowser.takeScreenshot().then(data => fs.writeFileSync(path.join(artifactDir, `mobile-${width}.png`), data, 'base64'));
        }
        await mainBrowser.manage().window().setRect({ width: 1366, height: 900 }); await adminBrowser.manage().window().setRect({ width: 1366, height: 900 });
    });
    await test('CT28', ['CT12'], async () => { await cleanup(); const pending = report.cleanup.filter(item => item.status === 'pendente'); assert.equal(pending.length, 0, 'Há registros de teste pendentes de limpeza.'); });
}

(async () => {
    try { await main(); }
    catch (error) {
        report.blocker = safeMessage(error);
        console.error('Execução bloqueada:', report.blocker);
    } finally {
        for (const spec of cases) if (!results.has(spec.id)) report.cases.push({ ...spec, status: 'bloqueado', detail: report.blocker || 'Execução interrompida antes deste caso.' });
        try { await cleanup(); } catch (error) { report.cleanup.push({ status: 'pendente', detail: safeMessage(error) }); }
        for (const driver of browsers) { try { await driver.quit(); } catch {} }
        save();
        console.log('Relatório:', path.relative(process.cwd(), path.join(artifactDir, 'results.json')));
        if (report.cases.some(c => c.status !== 'passou') || report.cleanup.some(c => c.status === 'pendente')) process.exitCode = 1;
    }
})();
