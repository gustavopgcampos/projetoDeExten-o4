async function viewLocals(req, res, next) {
  try {
    res.locals.currentUser = req.session.userId ? await require('../models').User.findByPk(req.session.userId, {
      attributes: ['id', 'email', 'role']
    }) : null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.formatMoney = value => Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    res.locals.categoryLabels = {
      CABLING: 'Cabling',
      CERTIFICACAO: 'Certificação',
      INFRAESTRUTURA: 'Infraestrutura',
      TELEFONIA: 'Telefonia'
    };
    next();
  } catch (error) {
    next(error);
  }
}
module.exports = viewLocals;
