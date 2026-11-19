require('dotenv').config();
const {
  sequelize,
  User
} = require('../src/models');
const ensureUserRoles = require('../src/config/user-roles');
const {
  email
} = require('../src/lib/validation');
(async () => {
  const address = email(process.argv[2]);
  const role = process.argv[3];
  if (!['ADMIN', 'COMMON'].includes(role)) throw new Error('Uso: npm run user:role -- email@exemplo.com ADMIN (ou COMMON)');
  await sequelize.authenticate();
  await ensureUserRoles(sequelize, User);
  const user = await User.findOne({
    where: {
      email: address
    }
  });
  if (!user) throw new Error('Usuário não encontrado. Cadastre a conta primeiro.');
  await user.update({
    role
  });
  console.log(`Papel atualizado para ${role}.`);
})().catch(error => {
  console.error('Não foi possível atualizar o papel:', error.message);
  process.exitCode = 1;
}).finally(() => sequelize.close());
