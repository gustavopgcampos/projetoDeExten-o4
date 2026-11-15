const { DataTypes } = require('sequelize');
module.exports = async function ensureUserRoles(sequelize, User) {
  const query = sequelize.getQueryInterface();
  const columns = await query.describeTable(User.getTableName());
  if (!columns.role) await query.addColumn(User.getTableName(), 'role', {
    type: DataTypes.ENUM('ADMIN', 'COMMON'), allowNull: false, defaultValue: 'COMMON',
  });
};
