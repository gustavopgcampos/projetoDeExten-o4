const express = require('express');
const controller = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/profile', controller.page);
router.post('/profile/password', controller.updatePassword);

module.exports = router;
