require('dotenv').config(); const express = require('express'); const session = require('express-session'); const SequelizeStore = require('connect-session-sequelize')(session.Store); const flash = require('connect-flash'); const path = require('path'); const expressLayouts = require('express-ejs-layouts'); const { sequelize } = require('./models'); const viewLocals = require('./middleware/view');
const app = express(); const port = Number(process.env.PORT || 3000); const store = new SequelizeStore({ db: sequelize });
app.set('view engine', 'ejs'); app.set('views', path.join(__dirname, 'views')); app.use(expressLayouts); app.set('layout', 'layouts/main'); app.use(express.urlencoded({ extended: true })); app.use(express.static(path.join(__dirname, '../public'))); app.use(session({ secret: process.env.SESSION_SECRET || 'dev-secret', store, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 } })); app.use(flash()); app.use(viewLocals); app.use(require('./routes')); app.use(require('./routes/dashboard')); app.use(require('./routes/profile'));
app.use((req, res) => res.status(404).render('error', { title: 'Página não encontrada', message: 'A página solicitada não existe.' }));
app.use(require('./middleware/errors').errorHandler);
sequelize.authenticate().then(() => store.sync()).then(() => app.listen(port, () => console.log(`MMVL Telecon rodando em http://localhost:${port}`))).catch(error => {
  const codes = new Set();
  const visited = new Set();
  function inspect(failure) {
    if (!failure || visited.has(failure)) return;
    visited.add(failure);
    if (failure.code) codes.add(failure.code);
    inspect(failure.parent); inspect(failure.original); inspect(failure.cause);
    if (Array.isArray(failure.errors)) failure.errors.forEach(inspect);
  }
  inspect(error);
  console.error('Falha ao iniciar aplicação:', JSON.stringify({
    type: error.name,
    codes: [...codes],
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || '3306',
    database: process.env.DB_NAME,
    tls: process.env.DB_SSL === 'true',
    caConfigured: Boolean(process.env.DB_SSL_CA || process.env.DB_SSL_CA_PATH),
  }));
  process.exit(1);
});
