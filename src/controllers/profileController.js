const bcrypt = require('bcryptjs');
const { User } = require('../models');
const v = require('../lib/validation');
const { formAction } = require('../middleware/errors');
exports.page = async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  if (!user) throw new v.FormError('Sua conta não está mais disponível. Entre novamente.', 401);
  res.render('profile', { title: 'Meu perfil', user });
};
exports.updatePassword = formAction('/profile', async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  if (!user) throw new v.FormError('Sua conta não está mais disponível. Entre novamente.', 401);
  if (typeof req.body.currentPassword !== 'string' || !(await bcrypt.compare(req.body.currentPassword, user.password))) throw new v.FormError('Senha atual inválida.');
  const password = v.password(req.body.newPassword);
  if (password !== req.body.confirmPassword) throw new v.FormError('A confirmação da senha não confere.');
  if (password === req.body.currentPassword) throw new v.FormError('Escolha uma senha diferente da atual.');
  await user.update({ password: await bcrypt.hash(password, 12) });
  req.flash('success', 'Senha alterada com sucesso.'); res.redirect('/profile');
});
