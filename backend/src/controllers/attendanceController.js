const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../services/auditService');

const prisma = new PrismaClient();

/**
 * POST /api/attendance/mark
 * Mark attendance for multiple members on a specific date.
 * Body: { memberIds: string[], date: string (ISO), present: boolean }
 * Only PERSONAL class members are allowed.
 */
const markAttendance = async (req, res, next) => {
  try {
    const { memberIds, date, present = true } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'memberIds array is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    const ownerId = admin.role === 'OWNER' ? admin.id : admin.teamId;
    const targetAdminId = ownerId || req.adminId;

    // Validate all members exist, belong to admin, and are PERSONAL class
    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        adminId: targetAdminId,
      },
      select: { id: true, name: true, classType: true },
    });

    const foundIds = members.map(m => m.id);
    const notFound = memberIds.filter(id => !foundIds.includes(id));
    if (notFound.length > 0) {
      return res.status(404).json({ success: false, message: `Members not found: ${notFound.join(', ')}` });
    }

    const groupMembers = members.filter(m => m.classType === 'GROUP');
    if (groupMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Attendance is only for Personal class members. Group members found: ${groupMembers.map(m => m.name).join(', ')}`,
      });
    }

    // Upsert attendance for each member on the given date
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const results = await Promise.all(
      memberIds.map(memberId =>
        prisma.attendance.upsert({
          where: {
            memberId_date: { memberId, date: attendanceDate },
          },
          update: { present, markedBy: req.adminId },
          create: {
            memberId,
            date: attendanceDate,
            present,
            markedBy: req.adminId,
          },
        })
      )
    );

    await logAction(req.adminId, 'MARK_ATTENDANCE', 'MEMBER', null, {
      memberCount: memberIds.length,
      date: attendanceDate.toISOString().split('T')[0],
      present,
    });

    res.json({
      success: true,
      data: results,
      message: `Attendance ${present ? 'marked' : 'unmarked'} for ${results.length} member(s)`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/:memberId
 * Get attendance records for a member.
 * Query: ?year=2026 (optional, defaults to current year)
 */
const getAttendance = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    const ownerId = admin.role === 'OWNER' ? admin.id : admin.teamId;

    // Verify member belongs to admin
    const member = await prisma.member.findFirst({
      where: { id: memberId, adminId: ownerId || req.adminId },
      select: { id: true, classType: true },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Calculate date range based on year boundary logic:
    // Show current year's data. If we're in Jan-Mar of a new year, also include Oct-Dec of prev year.
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    let startDate, endDate;

    if (year === now.getFullYear() && currentMonth <= 2) {
      // Jan, Feb, or Mar of current year — include Oct-Dec of previous year
      startDate = new Date(year - 1, 9, 1); // Oct 1 of previous year
    } else {
      startDate = new Date(year, 0, 1); // Jan 1 of requested year
    }
    endDate = new Date(year, 11, 31); // Dec 31 of requested year

    const records = await prisma.attendance.findMany({
      where: {
        memberId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        present: true,
        createdAt: true,
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      success: true,
      data: {
        memberId,
        year,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        records,
      },
      message: 'Attendance records fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/attendance/:memberId/:date
 * Remove a specific attendance record.
 */
const deleteAttendance = async (req, res, next) => {
  try {
    const { memberId, date } = req.params;

    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    const ownerId = admin.role === 'OWNER' ? admin.id : admin.teamId;

    // Verify member belongs to admin
    const member = await prisma.member.findFirst({
      where: { id: memberId, adminId: ownerId || req.adminId },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: { memberId_date: { memberId, date: attendanceDate } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    await prisma.attendance.delete({
      where: { id: existing.id },
    });

    await logAction(req.adminId, 'DELETE_ATTENDANCE', 'MEMBER', memberId, {
      name: member.name,
      date: attendanceDate.toISOString().split('T')[0],
    });

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  deleteAttendance,
};
