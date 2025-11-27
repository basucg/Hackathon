const express = require('express');
const {
  listRobots,
  createRobotHandler,
  getRobotHandler,
  updateRobotStatusHandler,
  sendCommandHandler
} = require('../controllers/robotController');

const router = express.Router();

router.get('/', listRobots);
router.post('/', createRobotHandler);
router.get('/:id', getRobotHandler);
router.put('/:id/status', updateRobotStatusHandler);
router.post('/:id/commands', sendCommandHandler);

module.exports = router;
