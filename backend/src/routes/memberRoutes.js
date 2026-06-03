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

const router = express.Router();

router.use(authMiddleware);

router.get('/societies', getSocieties);
router.get('/', getMembers);
router.get('/:id', getMemberById);

router.post(
  '/',
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

router.post('/bulk', bulkImport);

router.put(
  '/:id',
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

router.patch('/:id/status', toggleMemberStatus);
router.delete('/all', deleteAllMembers);
router.delete('/:id', deleteMember);

module.exports = router;
