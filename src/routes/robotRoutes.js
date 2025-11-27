const express = require('express');
const {
  listRobots,
  createRobotHandler,
  getRobotHandler,
  updateRobotStatusHandler,
  sendCommandHandler,
  getInsightsHandler,
  triggerOtaHandler,
  triggerFleetOtaHandler,
  sendModeHandler
} = require('../controllers/robotController');

const router = express.Router();

router.get('/', listRobots);
router.post('/', createRobotHandler);
router.post('/fleet/ota', triggerFleetOtaHandler);
router.get('/:id', getRobotHandler);
router.put('/:id/status', updateRobotStatusHandler);
router.post('/:id/commands', sendCommandHandler);
router.get('/:id/insights', getInsightsHandler);
router.post('/:id/ota', triggerOtaHandler);
router.post('/:id/mode', sendModeHandler);

module.exports = router;
