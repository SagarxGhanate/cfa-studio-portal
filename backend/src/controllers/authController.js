const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

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

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      data: { 
        token, 
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name || 'Admin User',
          avatar: admin.avatar || null
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

    const { email, password, name } = req.body;

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ success: false, error: 'Conflict', message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Admin User'
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
          avatar: admin.avatar || null
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

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    // Check if admin exists, if not, create one! (Since it's their own portal)
    let admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      // Auto-create an admin account with a random impossible password
      // so they can only log in via Google unless they do a password reset
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      admin = await prisma.admin.create({
        data: { 
          email, 
          password: randomPassword,
          name: payload.name,
          avatar: payload.picture
        }
      });
    } else if (!admin.name || !admin.avatar) {
      // Update existing admin with Google profile info if missing
      admin = await prisma.admin.update({
        where: { email },
        data: {
          name: payload.name,
          avatar: payload.picture
        }
      });
    }

    // Generate our own JWT token
    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      data: { 
        token, 
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name || 'Admin User',
          avatar: admin.avatar || null
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
        avatar: admin.avatar || null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, logout, changePassword, googleLogin, getMe };
