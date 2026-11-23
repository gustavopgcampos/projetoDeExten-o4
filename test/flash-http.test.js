const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { IncomingMessage, ServerResponse } = require('node:http');
const { Duplex } = require('node:stream');
const express = require('express');
const session = require('express-session');
const layouts = require('express-ejs-layouts');
const flash = require('connect-flash');

let createdUsers = 0;
const producers = [];
const modelsPath = require.resolve('../src/models');
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
        User: {
            findByPk: async () => ({ id: 'admin-id', email: 'admin@example.com', role: 'ADMIN' }),
            findOne: async () => null,
            create: async () => { createdUsers++; }
        },
        Producer: {
            create: async data => { producers.push({ ...data, id: 'producer-id', createdAt: new Date(), Products: [] }); },
            findAll: async () => producers
        }
    }
};

// Exercise actual HTTP request/response objects without binding a TCP port.
// Only the database models and session persistence are isolated adapters.
class AsyncStore extends session.MemoryStore {
    get(id, callback) { setImmediate(() => super.get(id, callback)); }
    set(id, value, callback) { setImmediate(() => super.set(id, value, callback)); }
}

function application() {
    const app = express();
    app.set('views', path.join(__dirname, '../src/views'));
    app.set('view engine', 'ejs');
    app.set('layout', 'layouts/main');
    app.use(layouts);
    app.use(session({ secret: 'isolated-flash-test', store: new AsyncStore(), resave: false, saveUninitialized: false }));
    app.use(flash());
    app.use(require('../src/middleware/view'));
    app.get('/_test/admin', (req, res) => {
        req.session.userId = 'admin-id';
        req.session.userEmail = 'admin@example.com';
        res.redirect('/dashboard/producers');
    });
    app.get('/_test/asset', (req, res) => res.status(204).end());
    app.use(require('../src/routes'));
    app.use(require('../src/routes/dashboard'));
    app.use(require('../src/middleware/errors').errorHandler);
    let cookie;

    return function request(method, url, fields = {}) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Timeout HTTP isolado: ' + method + ' ' + url)), 3000);
            const payload = method === 'POST' ? new URLSearchParams(fields).toString() : '';
            const chunks = [];
            const socket = new Duplex({
                read() {},
                write(chunk, encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); }
            });
            const req = new IncomingMessage(socket);
            req.method = method;
            req.url = url;
            req.body = fields;
            req.headers = { host: 'localhost', ...(cookie ? { cookie } : {}) };
            if (method === 'POST') {
                req.headers['content-type'] = 'application/x-www-form-urlencoded';
                req.headers['content-length'] = String(Buffer.byteLength(payload));
            }
            const res = new ServerResponse(req);
            res.assignSocket(socket);
            res.on('error', reject);
            res.on('finish', () => {
                clearTimeout(timer);
                const headers = res.getHeaders();
                if (headers['set-cookie']) cookie = headers['set-cookie'][0].split(';')[0];
                resolve({ status: res.statusCode, location: headers.location, html: Buffer.concat(chunks).toString() });
            });
            app(req, res);
            if (payload) req.push(payload);
            req.push(null);
        });
    };
}

test('CT03: confirmação diferente bloqueia cadastro e renderiza erro após redirecionar', async () => {
    const request = application();
    await request('GET', '/register');
    const response = await request('POST', '/register', {
        email: 'selenium@example.com', password: 'Password123!', confirmPassword: 'Diferente123!'
    });
    assert.equal(response.status, 302);
    assert.equal(response.location, '/register');
    await request('GET', '/_test/asset');
    const page = await request('GET', response.location);
    assert.equal(page.status, 200);
    assert.ok(page.html.includes('data-testid="flash-error"'));
    assert.ok(page.html.includes('A confirmação da senha não confere.'));
    assert.equal(createdUsers, 0);
    const refresh = await request('GET', '/register');
    assert.ok(!refresh.html.includes('data-testid="flash-error"'), 'Mensagem aparece uma única vez');
});

test('CT13: fabricante criado e mensagem de sucesso renderizada após redirecionar', async () => {
    const request = application();
    await request('GET', '/_test/admin');
    const response = await request('POST', '/dashboard/producers', { name: 'Fabricante de teste isolado' });
    assert.equal(response.status, 302);
    assert.equal(response.location, '/dashboard/producers');
    const page = await request('GET', response.location);
    assert.equal(page.status, 200);
    assert.ok(page.html.includes('data-testid="flash-success"'));
    assert.ok(page.html.includes('Fabricante cadastrado.'));
    assert.ok(page.html.includes('Fabricante de teste isolado'));
});
