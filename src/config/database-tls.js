const fs = require('node:fs');
const path = require('node:path');

module.exports = function databaseTls() {
  if (process.env.DB_SSL_CA) {
    return { rejectUnauthorized: true, ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') };
  }
  const caPath = path.resolve(__dirname, '../../', process.env.DB_SSL_CA_PATH || 'ca.pem');
  if (!fs.existsSync(caPath)) {
    throw new Error('Certificado CA ausente. Baixe o certificado CA do serviço Aiven e salve como ca.pem na pasta mmvl-express.');
  }
  return { rejectUnauthorized: true, ca: fs.readFileSync(caPath, 'utf8') };
};
