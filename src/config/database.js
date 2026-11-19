const {
  Sequelize
} = require('sequelize');
require('dotenv').config();
const databaseTls = require('./database-tls');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  dialectOptions: process.env.DB_SSL === 'true' ? {
    ssl: databaseTls()
  } : {},
  logging: false,
  define: {
    underscored: true,
    timestamps: true
  }
});
module.exports = sequelize;
