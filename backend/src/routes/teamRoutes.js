const express = require('express');
const { getTeamMembers, inviteTeamMember, updateTeamMemberRole, removeTeamMember } = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('OWNER')); // All team routes are OWNER-only

router.get('/', getTeamMembers);
router.post('/invite', inviteTeamMember);
router.patch('/:id/role', updateTeamMemberRole);
router.delete('/:id', removeTeamMember);

module.exports = router;
