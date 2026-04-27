const { Router } = require('express');
const TicketController = require('../controllers/ticketController');
const { createTicketRules, unclaimRules, assignRules, statusRules, pendingRules, resolveRules, difficultyRules } = require('../validators/ticketValidator');

const router = Router();

router.get('/', TicketController.getAll);
router.get('/staff-list', TicketController.getStaffList);
router.get('/:id', TicketController.getById);
router.post('/', createTicketRules, TicketController.create);
router.post('/:id/claim', TicketController.claim);
router.post('/:id/unclaim', unclaimRules, TicketController.unclaim);
router.post('/:id/assign', assignRules, TicketController.assign);
router.patch('/:id/status', statusRules, TicketController.updateStatus);
router.patch('/:id/pending', pendingRules, TicketController.setPending);
router.patch('/:id/resolve', resolveRules, TicketController.resolve);
router.patch('/:id/difficulty', difficultyRules, TicketController.setDifficulty);

module.exports = router;
