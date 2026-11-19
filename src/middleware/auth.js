const {
  User
} = require('../models');
async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) return res.redirect('/login?auth=required');
    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'email', 'role']
    });
    if (!user) return req.session.destroy(error => error ? next(error) : res.redirect('/login?auth=required'));
    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.role === 'ADMIN') return next();
  return res.status(403).render('error', {
    title: 'Acesso restrito',
    message: 'Somente administradores podem gerenciar itens e fabricantes.'
  });
}
module.exports = {
  requireAuth,
  requireAdmin
};
