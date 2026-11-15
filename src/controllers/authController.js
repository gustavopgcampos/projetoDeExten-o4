const bcrypt = require('bcryptjs');
const { User } = require('../models');
const v = require('../lib/validation');
const { formAction } = require('../middleware/errors');
exports.loginPage = (req, res) => res.render('auth/login', { title: 'Acesso ao sistema' });
exports.registerPage = (req, res) => res.render('auth/register', { title: 'Criar conta' });
function signIn(req, user) {
  return new Promise((resolve, reject) => req.session.regenerate(error => {
    if (error) return reject(error);
    req.session.userId = user.id; req.session.userEmail = user.email;
    req.session.save(error => error ? reject(error) : resolve());
  }));
}
exports.login = formAction('/login', async (req, res) => {
  const email = v.email(req.body.email);
  if (typeof req.body.password !== 'string' || !req.body.password) throw new v.FormError('Informe sua senha.');
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) throw new v.FormError('E-mail ou senha inválidos.');
  await signIn(req, user); res.redirect(user.role === 'ADMIN' ? '/dashboard' : '/budgets');
});
exports.register = formAction('/register', async (req, res) => {
  const email = v.email(req.body.email);
  const password = v.password(req.body.password);
  if (await User.findOne({ where: { email } })) throw new v.FormError('Este e-mail já está cadastrado.');
  const user = await User.create({ email, password: await bcrypt.hash(password, 12), role: 'COMMON' });
  await signIn(req, user); res.redirect('/budgets');
});
exports.logout = (req, res, next) => req.session.destroy(error => error ? next(error) : res.redirect('/'));
