const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAuditLogs = async (req, res, next) => {
  try {
    const adminId = req.adminId;
    const { action, entity, page = 1, limit = 50 } = req.query;

    // Get the admin to find teamId context
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    
    // OWNER sees all team logs, MANAGER/VIEWER see their own
    const ownerId = admin.role === 'OWNER' ? admin.id : admin.teamId;
    const teamAdminIds = ownerId
      ? (await prisma.admin.findMany({ where: { OR: [{ id: ownerId }, { teamId: ownerId }] }, select: { id: true } })).map(a => a.id)
      : [adminId];

    const where = { adminId: { in: teamAdminIds } };
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          admin: { select: { name: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
