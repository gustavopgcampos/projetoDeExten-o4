const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
require(path.join(root, 'node_modules/dotenv')).config({ path: path.join(root, '.env') });
const bcrypt = require(path.join(root, 'node_modules/bcryptjs'));
const { sequelize, User } = require(path.join(root, 'src/models'));
const ensureRoles = require(path.join(root, 'src/config/user-roles'));
const destination = path.join(root, '.env.selenium');

(async () => {
    if (fs.existsSync(destination)) throw Error('.env.selenium já existe. Configure suas credenciais nele ou renomeie-o antes de criar uma nova conta de teste.');
    await sequelize.authenticate();
    await ensureRoles(sequelize, User);
    const email = `selenium-admin-${randomUUID()}@example.com`;
    const password = randomBytes(24).toString('base64url');
    const content = [
        '# Conta ADMIN exclusiva dos testes. Banco selecionado pelo .env da aplicação.',
        'SELENIUM_BASE_URL=http://localhost:3000',
        `SELENIUM_ADMIN_EMAIL=${email}`, `SELENIUM_ADMIN_PASSWORD=${password}`,
        'SELENIUM_BROWSER=chrome', 'SELENIUM_HEADLESS=false', 'SELENIUM_STEP_DELAY=1500', 'SELENIUM_TIMEOUT=30000', 'SELENIUM_ALLOW_REMOTE=false', '',
    ].join('\n');
    let createdFile = false;
    try {
        await sequelize.transaction(async transaction => {
            await User.create({ email, password: await bcrypt.hash(password, 12), role: 'ADMIN' }, { transaction });
            fs.writeFileSync(destination, content, { flag: 'wx', mode: 0o600 });
            createdFile = true;
        });
    } catch (error) {
        if (createdFile) fs.unlinkSync(destination);
        throw error;
    }
    console.log('Conta ADMIN de teste criada. Credenciais salvas em .env.selenium (não exibidas).');
    console.log('A conta ADMIN de teste é mantida para novas execuções; os demais registros temporários são limpos pela suíte.');
})().catch(error => {
    console.error('Preparação bloqueada:', error.code || error.name, error.message ? 'Confira as configurações e a conexão.' : '');
    if (error.message?.includes('.env.selenium')) console.error(error.message);
    process.exitCode = 1;
}).finally(() => sequelize.close());
