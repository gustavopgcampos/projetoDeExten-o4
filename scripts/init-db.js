require('dotenv').config();
const mysql = require('mysql2/promise');
const { sequelize } = require('../src/models');

(async () => {
  const databaseName = process.env.DB_NAME || 'mmvl_telecon';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();

  await sequelize.sync();
  console.log(`Banco MySQL '${databaseName}' inicializado e tabelas criadas.`);
  await sequelize.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
