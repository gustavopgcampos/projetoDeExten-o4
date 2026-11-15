const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', { role: { type: DataTypes.ENUM('ADMIN', 'COMMON'), allowNull: false, defaultValue: 'COMMON' }, id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, email: { type: DataTypes.STRING(160), unique: true, allowNull: false, validate: { isEmail: true } }, password: { type: DataTypes.STRING(255), allowNull: false } });
const RegistrationInvite = sequelize.define('RegistrationInvite', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, tokenHash: { type: DataTypes.STRING(64), unique: true, allowNull: false }, expiresAt: { type: DataTypes.DATE, allowNull: false }, usedAt: DataTypes.DATE });
const Producer = sequelize.define('Producer', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, name: { type: DataTypes.STRING(160), unique: true, allowNull: false } });
const Product = sequelize.define('Product', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, category: { type: DataTypes.ENUM('CABLING', 'CERTIFICACAO', 'INFRAESTRUTURA', 'TELEFONIA'), allowNull: false }, productName: { type: DataTypes.STRING(200), allowNull: false }, detail: { type: DataTypes.STRING(160), allowNull: false }, ncm: DataTypes.STRING(30), unitValue: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' } });
const Budget = sequelize.define('Budget', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, title: { type: DataTypes.STRING(200), defaultValue: 'Novo orçamento' }, status: { type: DataTypes.ENUM('DRAFT', 'FINALIZED'), defaultValue: 'FINALIZED' }, totalValue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 } });
const BudgetItem = sequelize.define('BudgetItem', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, category: DataTypes.STRING(30), productId: DataTypes.UUID, productName: DataTypes.STRING(200), quantity: DataTypes.INTEGER, unitValue: DataTypes.DECIMAL(12, 2), markupPercentage: DataTypes.DECIMAL(5, 2), totalValue: DataTypes.DECIMAL(12, 2) });

Producer.hasMany(Product, { foreignKey: 'producerId' }); Product.belongsTo(Producer, { foreignKey: 'producerId' });
User.hasMany(Budget, { foreignKey: 'userId' }); Budget.belongsTo(User, { foreignKey: 'userId' });
Budget.hasMany(BudgetItem, { foreignKey: 'budgetId', onDelete: 'CASCADE' }); BudgetItem.belongsTo(Budget, { foreignKey: 'budgetId' });

module.exports = { sequelize, User, RegistrationInvite, Producer, Product, Budget, BudgetItem };
