const { Router } = require('express');
const ProfileController = require('../controllers/profileController');
const { updateProfileRules, changePasswordRules } = require('../validators/profileValidator');

const router = Router();

router.get('/:userId', ProfileController.getProfile);
router.put('/:userId', updateProfileRules, ProfileController.updateProfile);
router.put('/:userId/password', changePasswordRules, ProfileController.changePassword);

module.exports = router;
