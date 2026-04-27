const { Router } = require('express');
const LeaderboardController = require('../controllers/leaderboardController');

const router = Router();

router.get('/', LeaderboardController.getLeaderboard);
router.get('/periods', LeaderboardController.getPeriods);
router.get('/:staffId', LeaderboardController.getStaffStats);

module.exports = router;
