const crypto = require('node:crypto');
const {
  User,
  Budget,
  sequelize
} = require('../models');
const {
  id,
  FormError
} = require('../lib/validation');
const {
  formAction
} = require('../middleware/errors');
exports.csrf = (req, res, next) => {
  if (!req.session.usersCsrf) req.session.usersCsrf = crypto.randomBytes(32).toString('hex');
  res.locals.usersCsrf = req.session.usersCsrf;
  if (req.method !== 'GET' && req.body?._csrf !== req.session.usersCsrf) return next(new FormError('Formulário expirado. Atualize a página e tente novamente.', 403));
  next();
};
exports.list = async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'email', 'role', 'createdAt'],
    order: [['createdAt', 'DESC']]
  });
  res.render('dashboard/users', {
    title: 'Usuários',
    users
  });
};
// Lock administrators in a stable order before changing any administrative role.
async function modify(req, action) {
  const userId = id(req.params.id);
  await sequelize.transaction(async transaction => {
    const admins = await User.findAll({
      where: {
        role: 'ADMIN'
      },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!admins.some(user => user.id === req.user.id)) throw new FormError('Sua permissão administrativa foi alterada.', 403);
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!user) throw new FormError('Usuário não encontrado.', 404);
    await action(user, admins, transaction);
  });
}
exports.role = formAction('/dashboard/users', async (req, res) => {
  const role = req.body.role;
  if (!['ADMIN', 'COMMON'].includes(role)) throw new FormError('Selecione um papel válido.');
  await modify(req, async (user, admins, transaction) => {
    if (user.role === 'ADMIN' && role !== 'ADMIN' && admins.length <= 1) throw new FormError('É necessário manter pelo menos um administrador.');
    await user.update({
      role
    }, {
      transaction
    });
  });
  req.flash('success', 'Permissão do usuário atualizada.');
  res.redirect(req.user.id === req.params.id && role === 'COMMON' ? '/budgets' : '/dashboard/users');
});
exports.remove = formAction('/dashboard/users', async (req, res) => {
  if (req.params.id === req.user.id) throw new FormError('Você não pode excluir sua própria conta.');
  await modify(req, async (user, admins, transaction) => {
    if (user.role === 'ADMIN' && admins.length <= 1) throw new FormError('É necessário manter pelo menos um administrador.');
    if (await Budget.count({
      where: {
        userId: user.id
      },
      transaction
    })) throw new FormError('Este usuário possui orçamentos. A conta foi preservada para manter o histórico.');
    await user.destroy({
      transaction
    });
  });
  req.flash('success', 'Usuário excluído.');
  res.redirect('/dashboard/users');
});
