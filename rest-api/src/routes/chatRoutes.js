const { Router } = require('express');
const ChatController = require('../controllers/chatController');
const { sendMessageRules } = require('../validators/chatValidator');

const router = Router();

router.get('/:ticketId', ChatController.getMessages);
router.post('/:ticketId', sendMessageRules, ChatController.sendMessage);

module.exports = router;
