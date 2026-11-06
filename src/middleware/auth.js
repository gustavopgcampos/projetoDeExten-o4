function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login?auth=required');
  next();
}

module.exports = { requireAuth };
