const express = require('express'); const home = require('../controllers/homeController'); const auth = require('../controllers/authController');
const router = express.Router();
router.get('/', home.home); router.get('/login', auth.loginPage); router.post('/login', auth.login); router.get('/register', auth.registerPage); router.post('/register', auth.register); router.post('/logout', auth.logout); module.exports = router;
