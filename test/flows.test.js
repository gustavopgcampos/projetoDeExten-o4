const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const ejs = require('ejs');
const path = require('node:path');

// Isolated model adapter: exercises the real routers, middleware, controllers,
// bcrypt and EJS without a listening socket or access to production data.
const stores = {};

function model(name) {
    const rows = stores[name] = [];
    const match = (row, where = {}) => Object.entries(where).every(([key, value]) => Array.isArray(value) ? value.includes(row[key]) : row[key] === value);

    return {
        async create(data) {
            const row = {
                id: randomUUID(),
                createdAt: new Date(),
                role: 'COMMON',
                status: 'ACTIVE',
                ...data
            };

            Object.defineProperties(row, {
                update: {
                    value: async data => Object.assign(row, data)
                },
                destroy: {
                    value: async () => {
                        rows.splice(rows.indexOf(row), 1);
                    }
                }
            });

            rows.push(row);

            return row;
        },
        async findByPk(id) {
            return rows.find(row => row.id === id) || null;
        },
        async findOne({
            where
        }) {
            return rows.find(row => match(row, where)) || null;
        },
        async findAll({
            where
        } = {}) {
            return rows.filter(row => match(row, where));
        },
        async count({
            where
        }) {
            return rows.filter(row => match(row, where)).length;
        },
        async update(data, {
            where
        }) {
            rows.filter(row => match(row, where)).forEach(row => Object.assign(row, data));
        },
        async destroy({
            where
        }) {
            for (const row of [...rows]) if (match(row, where)) await row.destroy();
        }
    };
}

const models = Object.fromEntries(['User', 'Product', 'Producer', 'Budget', 'BudgetItem'].map(name => [name, model(name)]));

models.sequelize = {
    transaction: async callback => callback({
        LOCK: {
            UPDATE: 'UPDATE'
        }
    })
};

const modelsPath = require.resolve('../src/models');

require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: models
};

const routes = [require('../src/routes'), require('../src/routes/dashboard'), require('../src/routes/profile')];

const { errorHandler } = require('../src/middleware/errors');

const categories = {
    CABLING: 'Cabling',
    TELEFONIA: 'Telefonia',
    CERTIFICACAO: 'Certificação',
    INFRAESTRUTURA: 'Infraestrutura'
};

function client() {
    const client = {
        session: {},
        messages: []
    };

    function attach() {
        Object.defineProperties(client.session, {
            regenerate: {
                configurable: true,
                value: cb => {
                    for (const key of Object.keys(client.session)) delete client.session[key];

                    cb();
                }
            },
            save: {
                configurable: true,
                value: cb => cb()
            },
            destroy: {
                configurable: true,
                value: cb => {
                    client.session = {};

                    attach();
                    cb();
                }
            }
        });
    }

    attach();

    return client;
}

async function request(client, method, url, body = {}) {
    return new Promise((resolve, reject) => {
        const req = {
            method,
            url,
            originalUrl: url,
            baseUrl: '',
            body,
            query: {},
            session: client.session,
            flash: (...message) => client.messages.push(message)
        };
        const res = {
            locals: {
                currentUser: null,
                success: [],
                error: [],
                categoryLabels: categories,
                formatMoney: value => Number(value).toFixed(2)
            },
            statusCode: 200,
            status(code) {
                this.statusCode = code;

                return this;
            },
            redirect(destination) {
                resolve({
                    status: 302,
                    destination
                });
            },
            render(view, data) {
                ejs.renderFile(path.join(__dirname, '../src/views', view + '.ejs'), {
                    ...this.locals,
                    ...data
                }, (err, html) => err ? reject(err) : resolve({
                    status: this.statusCode,
                    html
                }));
            }
        };
        let index = 0;

        function next(error) {
            if (error) return errorHandler(error, req, res, reject);

            const router = routes[index++];

            if (!router) return resolve({
                status: 404
            });

            router.handle(req, res, next);
        }

        next();
    });
}

test('fluxos completos pelas rotas reais, com dados isolados', async () => {
    const visitor = client();

    assert.equal((await request(visitor, 'GET', '/login')).status, 200);
    assert.equal((await request(visitor, 'GET', '/register')).status, 200);
    assert.equal((await request(visitor, 'GET', '/dashboard')).destination, '/login?auth=required');

    const common = client();

    for (const confirmPassword of [undefined, '', 'Different123!']) {
        assert.equal((await request(common, 'POST', '/register', {
            email: 'teste@example.com',
            password: 'Password123!',
            confirmPassword
        })).destination, '/register');
        assert.equal(stores.User.length, 0, 'Confirmação inválida não cria usuário');
    }

    assert.equal((await request(common, 'POST', '/register', {
        email: 'teste@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'ADMIN'
    })).destination, '/budgets');

    const account = stores.User[0];

    assert.equal(account.role, 'COMMON');
    assert.notEqual(account.password, 'Password123!');
    assert.ok(await bcrypt.compare('Password123!', account.password));
    assert.equal((await request(common, 'POST', '/register', {
        email: account.email,
        password: 'Password123!',
        confirmPassword: 'Password123!'
    })).destination, '/register');

    const admin = client();
    const adminAccount = await models.User.create({
        email: 'admin@example.com',
        password: await bcrypt.hash('Password123!', 4),
        role: 'ADMIN'
    });

    admin.session.userId = adminAccount.id;

    for (const url of ['/dashboard', '/dashboard/producers', '/dashboard/users']) {
        assert.equal((await request(common, 'GET', url)).status, 403, url);
        assert.equal((await request(admin, 'GET', url)).status, 200, url);
    }
    for (const url of ['/dashboard/products', '/dashboard/products/bulk-delete', '/dashboard/products/' + randomUUID() + '/edit', '/dashboard/products/' + randomUUID() + '/delete', '/dashboard/producers', '/dashboard/producers/' + randomUUID() + '/edit', '/dashboard/producers/' + randomUUID() + '/delete', '/dashboard/users/' + adminAccount.id + '/role', '/dashboard/users/' + adminAccount.id + '/delete']) {
        assert.equal((await request(common, 'POST', url)).status, 403, url);
    }

    assert.equal((await request(admin, 'POST', '/dashboard/producers', {
        name: 'Fabricante TESTE'
    })).destination, '/dashboard/producers');

    const producer = stores.Producer[0];
    const data = {
        productName: 'Produto TESTE',
        detail: 'Cat6',
        category: 'CABLING',
        unitValue: '12.50',
        producerId: producer.id
    };

    await request(admin, 'POST', '/dashboard/products', data);

    const product = stores.Product[0];

    await request(admin, 'POST', '/dashboard/products/' + product.id + '/edit', {
        ...data,
        unitValue: '20.00'
    });

    assert.equal(product.unitValue, 20);

    await request(admin, 'POST', '/dashboard/products/' + product.id + '/edit', {
        ...data,
        unitValue: '-3'
    });

    assert.equal(product.unitValue, 20);

    const budget = {
        title: 'Orçamento TESTE',
        items: JSON.stringify([{
            productId: product.id,
            quantity: 2,
            markup: 10
        }])
    };

    assert.equal((await request(common, 'POST', '/budgets', budget)).destination, '/budgets');
    assert.equal(stores.Budget[0].totalValue, '44.00');
    assert.equal(stores.Budget[0].userId, account.id);
    assert.equal((await request(common, 'GET', '/budgets')).status, 200);

    const other = client();

    other.session.userId = adminAccount.id;

    const otherList = await request(other, 'GET', '/budgets');

    assert.ok(!otherList.html.includes('Orçamento TESTE'), 'Listagem não revela orçamento de outra conta');

    await request(other, 'POST', '/budgets/' + stores.Budget[0].id + '/delete');

    assert.equal(stores.Budget.length, 1, 'Orçamento de outra conta é preservado');

    await request(common, 'POST', '/budgets/' + stores.Budget[0].id + '/delete');

    assert.equal(stores.Budget.length, 0);
    assert.equal((await request(common, 'GET', '/profile')).status, 200);

    await request(common, 'POST', '/profile/password', {
        currentPassword: 'Password123!',
        newPassword: 'Changed123!',
        confirmPassword: 'Changed123!'
    });

    assert.ok(await bcrypt.compare('Changed123!', account.password));

    await request(common, 'POST', '/logout');

    assert.equal((await request(common, 'GET', '/budgets')).destination, '/login?auth=required');
    assert.equal((await request(common, 'POST', '/login', {
        email: account.email,
        password: 'wrong'
    })).destination, '/login');
    assert.equal((await request(common, 'POST', '/login', {
        email: account.email,
        password: 'Changed123!'
    })).destination, '/budgets');

    // Exercise user management with the CSRF token issued by the real route.
    await request(admin, 'GET', '/dashboard/users');

    assert.equal((await request(admin, 'POST', '/dashboard/users/' + account.id + '/role', {
        role: 'ADMIN'
    })).status, 403);

    const token = admin.session.usersCsrf;

    await request(admin, 'POST', '/dashboard/users/' + account.id + '/role', {
        role: 'ADMIN',
        _csrf: token
    });

    assert.equal((await request(common, 'GET', '/dashboard')).status, 200);

    await request(admin, 'POST', '/dashboard/users/' + account.id + '/role', {
        role: 'COMMON',
        _csrf: token
    });

    assert.equal((await request(common, 'GET', '/dashboard')).status, 403, 'Revogação vale na sessão existente');

    await request(admin, 'POST', '/dashboard/users/' + adminAccount.id + '/role', {
        role: 'COMMON',
        _csrf: token
    });

    assert.equal(adminAccount.role, 'ADMIN', 'Último administrador é preservado');

    await request(admin, 'POST', '/dashboard/users/' + adminAccount.id + '/delete', {
        _csrf: token
    });

    assert.ok(stores.User.includes(adminAccount));

    // Existing budget blocks deletion; clear only the isolated fixture afterward.
    const preserved = await models.Budget.create({
        userId: account.id
    });

    await request(admin, 'POST', '/dashboard/users/' + account.id + '/delete', {
        _csrf: token
    });

    assert.ok(stores.User.includes(account));

    await preserved.destroy();
    await request(admin, 'POST', '/dashboard/users/' + account.id + '/delete', {
        _csrf: token
    });

    assert.ok(!stores.User.includes(account));
    assert.equal((await request(common, 'GET', '/budgets')).destination, '/login?auth=required');

    await request(admin, 'POST', '/dashboard/products/' + product.id + '/delete');

    assert.equal(stores.Product.length, 0);

    await request(admin, 'POST', '/dashboard/producers/' + producer.id + '/delete');

    assert.equal(stores.Producer.length, 0);
});
