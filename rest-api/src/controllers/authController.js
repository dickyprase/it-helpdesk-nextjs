const UserModel = require('../models/userModel');
const { validationResult } = require('express-validator');

const AuthController = {
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);

      if (!user) {
        return res.status(401).json({ error: true, message: 'Email atau password salah' });
      }
      if (!user.is_active) {
        return res.status(403).json({ error: true, message: 'Akun Anda telah dinonaktifkan' });
      }

      const valid = await UserModel.verifyPassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: true, message: 'Email atau password salah' });
      }

      const { password_hash, ...userData } = user;
      res.json({ error: false, data: userData });
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: errors.array()[0].msg });
      }

      const { name, email, phone, password } = req.body;

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: true, message: 'Email sudah terdaftar' });
      }

      const user = await UserModel.create({ name, email, phone, password, role: 'USER' });
      res.status(201).json({ error: false, data: user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
