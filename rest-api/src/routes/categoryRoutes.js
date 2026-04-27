const { Router } = require('express');
const CategoryController = require('../controllers/categoryController');

const router = Router();

router.get('/', CategoryController.getAll);

module.exports = router;
