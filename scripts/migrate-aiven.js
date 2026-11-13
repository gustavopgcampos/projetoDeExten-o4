require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('node:fs');
const path = require('node:path');
const databaseTls = require('../src/config/database-tls');

async function main() {
  const targetConfig = require('../.aiven-connection.json');
  const ssl = databaseTls();
  const sourceConfig = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  };
  if (sourceConfig.host === targetConfig.host) throw new Error('O .env já aponta para o Aiven.');
  let source, target;
  try {
    source = await mysql.createConnection(sourceConfig);
    target = await mysql.createConnection({ ...targetConfig, ssl });
    const [existing] = await target.query('SHOW TABLES');
    if (existing.length) throw new Error('O destino contém tabelas. Transferência cancelada para preservar os dados.');
    const [tables] = await source.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    if (!tables.length) throw new Error('O banco local está vazio.');
    const backup = [];
    for (const table of tables) {
      const name = Object.values(table)[0];
      const [ddl] = await source.query('SHOW CREATE TABLE ??', [name]);
      const [rows] = await source.query('SELECT * FROM ??', [name]);
      backup.push({ name, ddl: ddl[0]['Create Table'], rows });
    }
    const backupPath = path.join(__dirname, '../.local-db-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backup), { mode: 0o600, flag: 'wx' });
    await target.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of backup) await target.query(table.ddl);
    await target.beginTransaction();
    try {
      for (const table of backup) {
        for (const row of table.rows) await target.query('INSERT INTO ?? SET ?', [table.name, row]);
        const [result] = await target.query('SELECT COUNT(*) AS total FROM ??', [table.name]);
        if (Number(result[0].total) !== table.rows.length) throw new Error(`Contagem divergente: ${table.name}`);
        console.log(`${table.name}: ${table.rows.length} registros conferidos.`);
      }
      await target.commit();
    } catch (error) { await target.rollback(); throw error; }
    await target.query('SET FOREIGN_KEY_CHECKS = 1');
    const envPath = path.join(__dirname, '../.env');
    let env = fs.readFileSync(envPath, 'utf8');
    fs.writeFileSync(`${envPath}.local-backup`, env, { mode: 0o600, flag: 'wx' });
    const values = { DB_HOST: targetConfig.host, DB_PORT: targetConfig.port, DB_NAME: targetConfig.database, DB_USER: targetConfig.user, DB_PASSWORD: targetConfig.password, DB_SSL: 'true' };
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`^${key}=.*$`, 'gm');
      const line = `${key}=${JSON.stringify(String(value))}`;
      env = pattern.test(env) ? env.replace(pattern, () => line) : `${env}\n${line}\n`;
    }
    fs.writeFileSync(envPath, env, { mode: 0o600 });
    console.log('Transferência concluída. .env atualizado para o Aiven com TLS. Reinicie a aplicação.');
  } finally {
    if (source) await source.end();
    if (target) await target.end();
  }
}
main().catch(error => { console.error('Transferência interrompida:', error.message); process.exitCode = 1; });
