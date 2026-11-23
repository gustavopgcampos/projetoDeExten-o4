const { test } = require('node:test');
const assert = require('node:assert/strict');

const path = require.resolve('../src/models');
let account = null;

require.cache[path] = {
    id: path,
    filename: path,
    loaded: true,
    exports: {
        User: {
            findByPk: async () => account
        }
    }
};

const { requireAuth, requireAdmin } = require('../src/middleware/auth');
const ejs = require('ejs');
const fs = require('node:fs');

test('visitante é direcionado para login', async () => {
    await requireAuth({
        session: {}
    }, {
        redirect: value => assert.equal(value, '/login?auth=required')
    }, () => assert.fail());
});
test('conta excluída perde a sessão', async () => {
    account = null;

    let destroyed = false;

    await requireAuth({
        session: {
            userId: 'id',
            destroy: cb => {
                destroyed = true;

                cb();
            }
        }
    }, {
        redirect: value => assert.equal(value, '/login?auth=required')
    }, () => assert.fail());

    assert.equal(destroyed, true);
});
test('papel vem do banco, não da sessão', async () => {
    account = {
        id: 'id',
        email: 'user@example.com',
        role: 'COMMON'
    };

    const req = {
            session: {
                userId: 'id',
                role: 'ADMIN'
            }
        },
        res = {
            locals: {}
        };
    let passed = false;

    await requireAuth(req, res, () => {
        passed = true;
    });

    assert.equal(passed, true);
    assert.equal(req.user.role, 'COMMON');

    requireAdmin(req, {
        status(code) {
            assert.equal(code, 403);

            return this;
        },
        render(view) {
            assert.equal(view, 'error');
        }
    }, () => assert.fail());
});
test('administrador pode acessar gerenciamento', () => {
    let passed = false;

    requireAdmin({
        user: {
            role: 'ADMIN'
        }
    }, {}, () => {
        passed = true;
    });

    assert.equal(passed, true);
});
test('menus de gerenciamento aparecem apenas para admin', () => {
    const template = fs.readFileSync(require.resolve('../src/views/partials/header.ejs'), 'utf8');
    const common = ejs.render(template, {
        currentUser: {
            role: 'COMMON'
        }
    });
    const admin = ejs.render(template, {
        currentUser: {
            role: 'ADMIN'
        }
    });

    assert.ok(!common.includes('href="/dashboard'));
    assert.ok(common.includes('href="/budgets"'));
    assert.ok(admin.includes('href="/dashboard/producers"'));
});
