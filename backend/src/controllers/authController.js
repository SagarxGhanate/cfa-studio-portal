const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { sendOtpEmail } = require('../services/emailService');
const { logAction } = require('../services/auditService');

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: { loginCount: { increment: 1 } }
    });

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    await logAction(admin.id, 'LOGIN', 'ADMIN', admin.id, { method: 'email' });

    res.json({
      success: true,
      data: { 
        token, 
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name || 'Admin User',
          avatar: admin.avatar || null,
          role: admin.role,
          teamId: admin.teamId,
          loginCount: updatedAdmin.loginCount,
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: errors.array()[0].msg });
    }

    const { email, password, name, securityCode } = req.body;

    const MASTER_CODE = process.env.MASTER_SECURITY_CODE || 'cfastudio2024';
    if (securityCode !== MASTER_CODE) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid Studio Registration Code' });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ success: false, error: 'Conflict', message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Admin User',
        role: 'OWNER',
        loginCount: 1,
      }
    });

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      data: { 
        token, 
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name || 'Admin User',
          avatar: admin.avatar || null,
          role: admin.role,
          teamId: null,
          loginCount: 1,
        }
      },
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.json({
    success: true,
    data: null,
    message: 'Logout successful'
  });
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: req.adminId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// ━━━ OTP-based Password Reset ━━━

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({ success: true, message: 'If this email is registered, you will receive an OTP shortly.' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.admin.update({
      where: { id: admin.id },
      data: { resetOtp: otp, resetOtpExpiry: expiry },
    });

    await sendOtpEmail(email, otp, admin.name);

    res.json({ success: true, message: 'If this email is registered, you will receive an OTP shortly.' });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.resetOtp || !admin.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (admin.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > admin.resetOtpExpiry) {
      // Clear expired OTP
      await prisma.admin.update({
        where: { id: admin.id },
        data: { resetOtp: null, resetOtpExpiry: null },
      });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // OTP valid — generate a short-lived reset token
    const resetToken = jwt.sign({ id: admin.id, purpose: 'password-reset' }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });

    res.json({ success: true, data: { resetToken }, message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      if (decoded.purpose !== 'password-reset') throw new Error('Invalid token purpose');
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please start over.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: decoded.id },
      data: { 
        password: hashedPassword, 
        resetOtp: null, 
        resetOtpExpiry: null 
      },
    });

    res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { credential, isSignup, securityCode } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    let admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      if (!isSignup) {
        return res.status(401).json({ success: false, message: 'Account not found. Please sign up first.' });
      }

      const MASTER_CODE = process.env.MASTER_SECURITY_CODE || 'cfastudio2024';
      if (securityCode !== MASTER_CODE) {
        return res.status(401).json({ success: false, message: 'Invalid Studio Registration Code' });
      }

      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      admin = await prisma.admin.create({
        data: { 
          email, 
          password: randomPassword,
          name: payload.name,
          avatar: payload.picture,
          role: 'OWNER',
        }
      });
    } else if (!admin.name || !admin.avatar) {
      admin = await prisma.admin.update({
        where: { email },
        data: {
          name: payload.name,
          avatar: payload.picture
        }
      });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: { loginCount: { increment: 1 } }
    });

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    await logAction(admin.id, 'LOGIN', 'ADMIN', admin.id, { method: 'google' });

    res.json({
      success: true,
      data: { 
        token, 
        user: {
          id: admin.id,
          email: admin.email,
          name: updatedAdmin.name || 'Admin User',
          avatar: updatedAdmin.avatar || null,
          role: updatedAdmin.role,
          teamId: updatedAdmin.teamId,
          loginCount: updatedAdmin.loginCount,
        }
      },
      message: 'Google login successful'
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid Google token' });
  }
};

const getMe = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    res.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name || 'Admin User',
        avatar: admin.avatar || null,
        role: admin.role,
        teamId: admin.teamId,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, logout, changePassword, forgotPassword, verifyOtp, resetPassword, googleLogin, getMe };
