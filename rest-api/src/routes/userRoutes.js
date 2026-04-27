const { Router } = require('express');
const UserController = require('../controllers/userController');
const { createUserRules, updateUserRules } = require('../validators/userValidator');

const router = Router();

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', createUserRules, UserController.create);
router.put('/:id', updateUserRules, UserController.update);
router.patch('/:id/toggle-active', UserController.toggleActive);

module.exports = router;
