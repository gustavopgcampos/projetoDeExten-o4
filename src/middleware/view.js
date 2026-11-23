async function viewLocals(req, res, next) {
    try {
        res.locals.currentUser = req.session.userId ? await require('../models').User.findByPk(req.session.userId, {
            attributes: ['id', 'email', 'role']
        }) : null;
        res.locals.success = [];
        res.locals.error = [];

        // Persist notices before the browser follows the redirect, including
        // when the session store writes asynchronously to a remote database.
        const redirect = res.redirect;
        res.redirect = function (...args) {
            const notices = req.session?.flash;
            const hasNotices = notices && Object.values(notices).some(items => Array.isArray(items) && items.length);

            if (!hasNotices || typeof req.session.save !== 'function') {
                return redirect.apply(this, args);
            }

            req.session.save(error => {
                if (error) return next(error);

                redirect.apply(this, args);
            });
        };

        // Consume flash messages only when this request actually renders a page.
        const render = res.render;
        res.render = function (...args) {
            res.locals.success = req.flash('success');
            res.locals.error = req.flash('error');

            return render.apply(this, args);
        };
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
