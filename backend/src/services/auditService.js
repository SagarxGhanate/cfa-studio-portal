const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Log an action to the audit trail.
 * @param {string} adminId - The admin performing the action
 * @param {string} action  - CREATE | UPDATE | DELETE | BULK_IMPORT | WIPE_ALL | STATUS_TOGGLE | LOGIN | INVITE | REMOVE
 * @param {string} entity  - MEMBER | ADMIN | TEAM
 * @param {string|null} entityId - Target entity ID (null for bulk ops)
 * @param {object|string|null} details - Extra context (will be JSON-stringified if object)
 */
const logAction = async (adminId, action, entity, entityId = null, details = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      },
    });
  } catch (err) {
    // Never let audit logging break the main flow
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAction };
