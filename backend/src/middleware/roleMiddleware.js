const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware factory to restrict routes to specific roles.
 * Usage: requireRole('OWNER') or requireRole('OWNER', 'MANAGER')
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!allowedRoles.includes(admin.role)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Forbidden',
          message: `This action requires ${allowedRoles.join(' or ')} role. Your role: ${admin.role}` 
        });
      }

      // Attach role to request for downstream use
      req.adminRole = admin.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requireRole };
