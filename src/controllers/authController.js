const bcrypt = require('bcryptjs');
const { User } = require('../models');
exports.loginPage = (req, res) => res.render('auth/login', { title: 'Acesso ao sistema' });
exports.registerPage = (req, res) => res.render('auth/register', { title: 'Criar conta' });
exports.login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) { req.flash('error', 'E-mail ou senha inválidos.'); return res.redirect('/login'); }
  req.session.userId = user.id; req.session.userEmail = user.email; res.redirect('/dashboard');
};
exports.register = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(); const password = req.body.password || '';
  if (!email || password.length < 8) { req.flash('error', 'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.'); return res.redirect('/register'); }
  try { const user = await User.create({ email, password: await bcrypt.hash(password, 12) }); req.session.userId = user.id; req.session.userEmail = user.email; res.redirect('/dashboard'); } catch (error) { req.flash('error', error.name === 'SequelizeUniqueConstraintError' ? 'Este e-mail já está cadastrado.' : 'Não foi possível criar a conta.'); res.redirect('/register'); }
};
exports.logout = (req, res) => req.session.destroy(() => res.redirect('/'));
