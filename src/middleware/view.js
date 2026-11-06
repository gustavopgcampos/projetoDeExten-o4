function viewLocals(req, res, next) {
  res.locals.currentUser = req.session.userEmail ? { email: req.session.userEmail } : null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.formatMoney = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  res.locals.categoryLabels = { CABLING: 'Cabling', CERTIFICACAO: 'Certificação', INFRAESTRUTURA: 'Infraestrutura', TELEFONIA: 'Telefonia' };
  next();
}

module.exports = viewLocals;
