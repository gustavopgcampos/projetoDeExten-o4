const { test } = require('node:test');
const assert = require('node:assert/strict');
const v = require('../src/lib/validation');
const { errorHandler } = require('../src/middleware/errors');

const productId = '11111111-1111-4111-8111-111111111111';
const modelsPath = require.resolve('../src/models');
let writes = 0;
let rolledBack = false;
const product = { id: productId, status: 'ACTIVE', unitValue: '10.00', update: async () => { writes++; } };
const models = {
  Product: { findByPk: async () => product, create: async () => { writes++; } },
  Producer: { findByPk: async () => null },
  Budget: { create: async () => { writes++; return { id: productId }; } },
  BudgetItem: { create: async () => { writes++; } },
  sequelize: { transaction: async callback => { try { return await callback({}); } catch (error) { rolledBack = true; throw error; } } },
};
require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: models };
const controller = require('../src/controllers/dashboardController');
async function invoke(handler, body) {
  let error, redirect;
  const req = { body, params: { id: productId }, session: { userId: productId }, flash() {} };
  const res = { locals: {}, redirect(path) { redirect = path; } };
  await handler(req, res, value => { error = value; });
  return { error, redirect };
}
const valid = { productName: 'Cabo', detail: 'Cat6', category: 'CABLING', unitValue: '10,50' };

test('rejeita valores negativos, infinitos, vazios, objetos e precisão excessiva', () => {
  for (const value of ['-1', 'Infinity', '', {}, '1.234', '10000000000']) assert.throws(() => v.decimal(value, 'Preço', 9999999999.99), v.FormError);
  assert.equal(v.decimal('10,50', 'Preço', 100), 10.5);
});
test('valida e-mail, espaços em branco e senha longa em bytes', () => {
  assert.throws(() => v.email('errado'), v.FormError);
  assert.throws(() => v.text('   ', 'nome', 160), v.FormError);
  assert.throws(() => v.password('á'.repeat(37)), v.FormError);
  assert.equal(v.email(' EXEMPLO@SITE.COM '), 'exemplo@site.com');
});
test('cadastro e edição rejeitam preço negativo antes da escrita', async () => {
  writes = 0;
  for (const handler of [controller.createProduct, controller.updateProduct]) {
    assert.ok((await invoke(handler, { ...valid, unitValue: '-5' })).error instanceof v.FormError);
  }
  assert.equal(writes, 0);
});
test('fabricante inexistente é rejeitado', async () => {
  assert.ok((await invoke(controller.createProduct, { ...valid, producerId: productId })).error instanceof v.FormError);
});
test('cadastro e edição válidos gravam e retornam ao catálogo', async () => {
  writes = 0;
  for (const handler of [controller.createProduct, controller.updateProduct]) assert.equal((await invoke(handler, valid)).redirect, '/dashboard');
  assert.equal(writes, 2);
});
test('orçamento rejeita JSON inválido e quantidade fracionada', async () => {
  assert.ok((await invoke(controller.createBudget, { items: '{' })).error instanceof v.FormError);
  assert.ok((await invoke(controller.createBudget, { items: JSON.stringify([{ productId, quantity: '1.5', markup: 0 }]) })).error instanceof v.FormError);
});
test('produto inativo cancela transação sem criar orçamento', async () => {
  product.status = 'INACTIVE'; writes = 0; rolledBack = false;
  const result = await invoke(controller.createBudget, { items: JSON.stringify([{ productId, quantity: 1, markup: 0 }]) });
  assert.ok(result.error instanceof v.FormError); assert.equal(writes, 0); assert.equal(rolledBack, true);
  product.status = 'ACTIVE';
});
test('erro de formulário exibe mensagem e redireciona', () => {
  const messages = [];
  errorHandler(new v.FormError('Preço inválido.'), { session: {}, flash: (...args) => messages.push(args) }, { locals: { errorDestination: '/dashboard' }, redirect: destination => assert.equal(destination, '/dashboard') }, () => assert.fail());
  assert.deepEqual(messages, [['error', 'Preço inválido.']]);
});
test('erro inesperado mostra página amigável sem SQL ou senha', () => {
  const original = console.error; console.error = () => {};
  try {
    errorHandler(new Error('SQL senha secreta'), {}, { locals: {}, status(code) { assert.equal(code, 500); return this; }, render(view, data) { assert.equal(view, 'error'); assert.ok(!data.message.includes('secreta')); assert.ok(!data.message.includes('SQL')); } }, () => assert.fail());
  } finally { console.error = original; }
});
