const { test } = require('node:test');
const assert = require('node:assert/strict');
const viewLocals = require('../src/middleware/view');

test('redirecionamento aguarda confirmação da gravação da sessão', async () => {
    const events = [];
    let saved;
    const req = {
        session: {
            flash: { success: ['Fabricante cadastrado.'] },
            save(callback) { events.push('save'); saved = callback; }
        },
        flash() { return []; }
    };
    const res = { locals: {}, render() {}, redirect() { events.push('redirect'); } };
    await viewLocals(req, res, error => { if (error) throw error; });
    res.redirect('/dashboard/producers');
    assert.deepEqual(events, ['save']);
    saved();
    assert.deepEqual(events, ['save', 'redirect']);
});

test('falha ao salvar sessão é encaminhada e não redireciona', async () => {
    const failure = new Error('Store unavailable');
    const req = { session: { flash: { error: ['Falha de validação'] }, save(callback) { callback(failure); } }, flash() { return []; } };
    let received;
    const res = { locals: {}, render() {}, redirect() { assert.fail('Não deveria redirecionar'); } };
    await viewLocals(req, res, error => { received = error; });
    res.redirect('/register');
    assert.equal(received, failure);
});

test('requisições sem renderização preservam mensagens para a próxima página', async () => {
    const pending = { success: ['Fabricante cadastrado.'], error: ['A confirmação da senha não confere.'] };
    const req = {
        session: {},
        flash(type) {
            const messages = pending[type] || [];
            pending[type] = [];
            return messages;
        }
    };
    const redirectResponse = { locals: {}, render() {} };
    await viewLocals(req, redirectResponse, error => { if (error) throw error; });

    assert.equal(pending.success.length, 1);
    assert.equal(pending.error.length, 1);

    let rendered;
    const pageResponse = {
        locals: {},
        render() { rendered = { success: this.locals.success, error: this.locals.error }; }
    };
    await viewLocals(req, pageResponse, error => { if (error) throw error; });
    pageResponse.render('home');

    assert.deepEqual(rendered.success, ['Fabricante cadastrado.']);
    assert.deepEqual(rendered.error, ['A confirmação da senha não confere.']);
    assert.deepEqual(pending, { success: [], error: [] });
});
