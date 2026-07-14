const express = require('express');
const {
  markAttendance,
  getAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Read routes — all roles
router.get('/:memberId', getAttendance);

// Write routes — OWNER and MANAGER only
router.post('/mark', requireRole('OWNER', 'MANAGER'), markAttendance);
router.delete('/:memberId/:date', requireRole('OWNER', 'MANAGER'), deleteAttendance);

module.exports = router;
