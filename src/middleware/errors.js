function messageFor(error) {
  if (error.expose) return error.message;
  if (error.name === 'SequelizeUniqueConstraintError') return 'Já existe um cadastro com esses dados.';
  if (error.name === 'SequelizeValidationError') return 'Confira os campos preenchidos e seus limites.';
  if (error.name === 'SequelizeForeignKeyConstraintError') return 'O registro está vinculado a outros dados ou não está mais disponível. Atualize a página.';
  if (error.type === 'entity.too.large') return 'O formulário enviado é muito grande.';
  if (error.type === 'entity.parse.failed') return 'Não foi possível ler o formulário. Confira os dados.';
  return 'Não foi possível concluir a operação. Tente novamente em alguns instantes.';
}
function formAction(destination, action) {
  return async (req, res, next) => {
    try { await action(req, res); }
    catch (error) { res.locals.errorDestination = destination; next(error); }
  };
}
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const message = messageFor(error);
  if (!error.expose) console.error('Falha na requisição:', error.name || 'Error');
  if (res.locals.errorDestination && req.session && typeof req.flash === 'function') {
    req.flash('error', message);
    return res.redirect(res.locals.errorDestination);
  }
  const status = error.expose ? error.status : (error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500);
  return res.status(status).render('error', {
    title: status === 404 ? 'Registro não encontrado' : 'Não foi possível concluir', message,
    currentUser: req.session?.userEmail ? { email: req.session.userEmail } : null,
    success: [], error: [],
  });
}
module.exports = { formAction, errorHandler, messageFor };
