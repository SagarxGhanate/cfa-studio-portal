const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

const getMembers = async (req, res, next) => {
  try {
    const adminId = req.adminId;
    const { search, sortBy, order, status, category, classType, page = 1, limit = 20 } = req.query;

    const queryOptions = {
      where: { adminId },
      orderBy: {},
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    };

    if (search) {
      queryOptions.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { guardianName: { contains: search, mode: 'insensitive' } },
        { guardianPhone: { contains: search } },
      ];
      queryOptions.where.adminId = adminId;
    }

    if (status && status !== 'all') {
      queryOptions.where.isActive = status === 'active';
    }

    if (category && category !== 'all') {
      queryOptions.where.category = category;
    }

    if (classType && classType !== 'all') {
      queryOptions.where.classType = classType;
    }

    if (sortBy) {
      queryOptions.orderBy[sortBy] = order === 'desc' ? 'desc' : 'asc';
    } else {
      queryOptions.orderBy.createdAt = 'desc';
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany(queryOptions),
      prisma.member.count({ where: queryOptions.where }),
    ]);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      message: 'Members fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getMemberById = async (req, res, next) => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: req.params.id, adminId: req.adminId },
    });

    if (!member) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Member not found' });
    }

    res.json({ success: true, data: member, message: 'Member fetched successfully' });
  } catch (error) {
    next(error);
  }
};

const createMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: errors.array()[0].msg });
    }

    const newMember = await prisma.member.create({
      data: { ...req.body, adminId: req.adminId },
    });

    res.status(201).json({ success: true, data: newMember, message: 'Member created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: errors.array()[0].msg });
    }

    // Ensure member belongs to this admin
    const existing = await prisma.member.findFirst({ where: { id: req.params.id, adminId: req.adminId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Member not found' });
    }

    const updatedMember = await prisma.member.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ success: true, data: updatedMember, message: 'Member updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const existing = await prisma.member.findFirst({ where: { id: req.params.id, adminId: req.adminId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Member not found' });
    }

    await prisma.member.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, data: null, message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const toggleMemberStatus = async (req, res, next) => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: req.params.id, adminId: req.adminId },
    });

    if (!member) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Member not found' });
    }

    const updatedMember = await prisma.member.update({
      where: { id: req.params.id },
      data: { isActive: !member.isActive },
    });

    res.json({ success: true, data: updatedMember, message: 'Member status toggled successfully' });
  } catch (error) {
    next(error);
  }
};

const getSocieties = async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { adminId: req.adminId, society: { not: null } },
      select: { society: true },
      distinct: ['society'],
      orderBy: { society: 'asc' },
    });

    const societies = members.map(m => m.society).filter(Boolean);
    res.json({ success: true, data: societies });
  } catch (error) {
    next(error);
  }
};

const bulkImport = async (req, res, next) => {
  try {
    const adminId = req.adminId;
    const { members: rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No members data provided' });
    }

    const validClassTypes = ['PERSONAL', 'GROUP'];
    const validCategories = ['KIDS', 'TODDLERS', 'ADULTS'];
    const errors = [];
    const validMembers = [];

    rows.forEach((row, i) => {
      const rowNum = i + 1;
      if (!row.name || !row.phone || !row.age || !row.location || !row.joiningDate) {
        errors.push(`Row ${rowNum}: Missing required fields (name, phone, age, location, joiningDate)`);
        return;
      }

      const classType = (row.classType || 'GROUP').toUpperCase();
      const category = (row.category || 'ADULTS').toUpperCase();

      if (!validClassTypes.includes(classType)) {
        errors.push(`Row ${rowNum}: Invalid classType "${row.classType}". Must be PERSONAL or GROUP`);
        return;
      }
      if (!validCategories.includes(category)) {
        errors.push(`Row ${rowNum}: Invalid category "${row.category}". Must be KIDS, TODDLERS, or ADULTS`);
        return;
      }

      validMembers.push({
        name: String(row.name).trim(),
        phone: String(row.phone).trim(),
        age: parseInt(row.age, 10) || 0,
        location: String(row.location).trim(),
        society: row.society ? String(row.society).trim() : null,
        joiningDate: new Date(row.joiningDate),
        isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
        classType,
        category,
        guardianName: row.guardianName ? String(row.guardianName).trim() : null,
        guardianPhone: row.guardianPhone ? String(row.guardianPhone).trim() : null,
        adminId,
      });
    });

    let created = 0;
    if (validMembers.length > 0) {
      const result = await prisma.member.createMany({ data: validMembers });
      created = result.count;
    }

    res.json({
      success: true,
      data: { created, skipped: rows.length - validMembers.length, errors },
      message: `Successfully imported ${created} members${errors.length > 0 ? ` (${errors.length} rows skipped)` : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAllMembers = async (req, res, next) => {
  try {
    const result = await prisma.member.deleteMany({ where: { adminId: req.adminId } });
    res.json({ success: true, message: `Successfully deleted all ${result.count} members` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  deleteAllMembers,
  toggleMemberStatus,
  getSocieties,
  bulkImport
};
