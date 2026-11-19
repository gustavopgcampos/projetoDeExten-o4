const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const adminId = '11111111-1111-4111-8111-111111111111';
const targetId = '22222222-2222-4222-8222-222222222222';
let admins, target, budgets, writes;
const modelsPath = require.resolve('../src/models');
require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: {
    User: {
      findAll: async () => admins,
      findByPk: async () => target
    },
    Budget: {
      count: async () => budgets
    },
    sequelize: {
      transaction: async fn => fn({
        LOCK: {
          UPDATE: 'UPDATE'
        }
      })
    }
  }
};
const controller = require('../src/controllers/usersController');
function reset(role = 'COMMON') {
  admins = [{
    id: adminId,
    role: 'ADMIN'
  }];
  budgets = 0;
  writes = 0;
  target = {
    id: targetId,
    role,
    update: async () => {
      writes++;
    },
    destroy: async () => {
      writes++;
    }
  };
}
async function invoke(action, userId = targetId, role = 'ADMIN') {
  let error, redirect;
  await action({
    user: {
      id: adminId
    },
    params: {
      id: userId
    },
    body: {
      role
    },
    flash() {}
  }, {
    locals: {},
    redirect: path => {
      redirect = path;
    }
  }, value => {
    error = value;
  });
  return {
    error,
    redirect
  };
}
test('gestão de usuários preserva as regras de acesso e os dados', async () => {
  reset();
  assert.equal((await invoke(controller.role)).redirect, '/dashboard/users');
  assert.equal(writes, 1);
  reset();
  assert.ok((await invoke(controller.role, targetId, 'INVALID')).error);
  assert.equal(writes, 0);
  reset('ADMIN');
  admins = [target, {
    id: adminId
  }];
  assert.equal((await invoke(controller.role, targetId, 'COMMON')).error, undefined);
  reset('ADMIN');
  target.id = adminId;
  assert.ok((await invoke(controller.role, adminId, 'COMMON')).error);
  assert.equal(writes, 0);
  reset();
  assert.ok((await invoke(controller.remove, adminId)).error);
  assert.equal(writes, 0);
  reset();
  budgets = 1;
  assert.ok((await invoke(controller.remove)).error);
  assert.equal(writes, 0);
  reset();
  assert.equal((await invoke(controller.remove)).redirect, '/dashboard/users');
  assert.equal(writes, 1);
  reset();
  admins = [];
  assert.ok((await invoke(controller.role)).error);
  assert.equal(writes, 0);
});
test('formulário exige token de sessão', () => {
  let error;
  controller.csrf({
    method: 'POST',
    session: {
      usersCsrf: 'valid'
    },
    body: {
      _csrf: 'invalid'
    }
  }, {
    locals: {}
  }, value => {
    error = value;
  });
  assert.equal(error.status, 403);
});
