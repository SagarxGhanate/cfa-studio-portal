const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logAction } = require('../services/auditService');
const { sendOtpEmail } = require('../services/emailService');

const prisma = new PrismaClient();

const getTeamMembers = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    
    if (admin.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only the owner can manage the team' });
    }

    const members = await prisma.admin.findMany({
      where: { teamId: admin.id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        avatar: true, 
        role: true, 
        createdAt: true, 
        initialPassword: true 
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

const inviteTeamMember = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required' });
    }

    if (!['MANAGER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be MANAGER or VIEWER' });
    }

    const owner = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (owner.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only the owner can invite team members' });
    }

    // Check if email already exists
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 char hex string
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newMember = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        initialPassword: tempPassword,
        name: name || email.split('@')[0],
        role,
        teamId: owner.id,
      },
    });

    await logAction(req.adminId, 'INVITE', 'TEAM', newMember.id, { email, role });

    // Log temp password (in production, this would be emailed)
    console.log(`═══════════════════════════════════════════`);
    console.log(`  🎟️  Team invite for ${email}`);
    console.log(`  Temp password: ${tempPassword}`);
    console.log(`  Role: ${role}`);
    console.log(`═══════════════════════════════════════════`);

    res.status(201).json({
      success: true,
      data: {
        id: newMember.id,
        email: newMember.email,
        name: newMember.name,
        role: newMember.role,
        tempPassword, // Return to owner so they can share it
      },
      message: `Team member invited successfully. Share the temporary password with them.`,
    });
  } catch (error) {
    next(error);
  }
};

const updateTeamMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['MANAGER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be MANAGER or VIEWER' });
    }

    const owner = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (owner.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only the owner can change roles' });
    }

    const member = await prisma.admin.findFirst({ where: { id, teamId: owner.id } });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: { role },
    });

    await logAction(req.adminId, 'UPDATE', 'TEAM', id, { email: member.email, from: member.role, to: role });

    res.json({
      success: true,
      data: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
      message: `Role updated to ${role}`,
    });
  } catch (error) {
    next(error);
  }
};

const removeTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const owner = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (owner.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only the owner can remove team members' });
    }

    const member = await prisma.admin.findFirst({ where: { id, teamId: owner.id } });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    await prisma.admin.delete({ where: { id } });

    await logAction(req.adminId, 'REMOVE', 'TEAM', id, { email: member.email, role: member.role });

    res.json({ success: true, message: `${member.name || member.email} removed from team` });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeamMembers, inviteTeamMember, updateTeamMemberRole, removeTeamMember };
