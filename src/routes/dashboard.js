const express = require('express');
const controller = require('../controllers/dashboardController');
const {
  requireAuth,
  requireAdmin
} = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);
router.use('/dashboard', requireAdmin);
router.get('/dashboard', controller.dashboard);
router.post('/dashboard/products', controller.createProduct);
router.post('/dashboard/products/bulk-delete', controller.bulkDeleteProducts);
router.post('/dashboard/products/:id/edit', controller.updateProduct);
router.post('/dashboard/products/:id/delete', controller.deleteProduct);
router.get('/dashboard/producers', controller.producers);
router.post('/dashboard/producers', controller.createProducer);
router.post('/dashboard/producers/:id/edit', controller.updateProducer);
router.post('/dashboard/producers/:id/delete', controller.deleteProducer);
router.get('/budgets', controller.budgets);
router.post('/budgets', controller.createBudget);
router.post('/budgets/:id/delete', controller.deleteBudget);
const users = require('../controllers/usersController');
router.use('/dashboard/users', users.csrf);
router.get('/dashboard/users', users.list);
router.post('/dashboard/users/:id/role', users.role);
router.post('/dashboard/users/:id/delete', users.remove);
module.exports = router;
