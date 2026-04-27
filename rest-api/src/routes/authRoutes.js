const { Router } = require('express');
const AuthController = require('../controllers/authController');
const { loginRules, registerRules } = require('../validators/authValidator');

const router = Router();

router.post('/login', loginRules, AuthController.login);
router.post('/register', registerRules, AuthController.register);

module.exports = router;
