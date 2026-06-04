const express = require('express');
const { body } = require('express-validator');
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  deleteAllMembers,
  toggleMemberStatus,
  getSocieties,
  bulkImport
} = require('../controllers/memberController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Read routes — all roles
router.get('/societies', getSocieties);
router.get('/', getMembers);
router.get('/:id', getMemberById);

// Write routes — OWNER and MANAGER only
router.post(
  '/',
  requireRole('OWNER', 'MANAGER'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('age').isInt({ min: 1 }).withMessage('Age must be a positive integer'),
    body('location').notEmpty().withMessage('Location is required'),
    body('joiningDate').isISO8601().toDate().withMessage('Valid joining date is required'),
    body('classType').isIn(['PERSONAL', 'GROUP']).withMessage('Invalid class type'),
    body('category').isIn(['KIDS', 'TODDLERS', 'ADULTS']).withMessage('Invalid category')
  ],
  createMember
);

router.post('/bulk', requireRole('OWNER', 'MANAGER'), bulkImport);

router.put(
  '/:id',
  requireRole('OWNER', 'MANAGER'),
  [
    body('name').optional().notEmpty(),
    body('phone').optional().notEmpty(),
    body('age').optional().isInt({ min: 1 }),
    body('location').optional().notEmpty(),
    body('joiningDate').optional().isISO8601().toDate(),
    body('classType').optional().isIn(['PERSONAL', 'GROUP']),
    body('category').optional().isIn(['KIDS', 'TODDLERS', 'ADULTS'])
  ],
  updateMember
);

router.patch('/:id/status', requireRole('OWNER', 'MANAGER'), toggleMemberStatus);

// Destructive routes — OWNER only
router.delete('/all', requireRole('OWNER'), deleteAllMembers);
router.delete('/:id', requireRole('OWNER', 'MANAGER'), deleteMember);

module.exports = router;
