const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'name, email y password son obligatorios',
      });
    }

    const existingUser = await User.unscoped().findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'El email ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    const safeUser = user.get({ plain: true });
    delete safeUser.password;

    return res.status(201).json({
      success: true,
      data: { user: safeUser, token: signToken(user) },
      message: 'Usuario registrado correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al registrar usuario',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'email y password son obligatorios',
      });
    }

    const user = await User.unscoped().findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Credenciales inválidas',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Credenciales inválidas',
      });
    }

    const safeUser = user.get({ plain: true });
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      data: { user: safeUser, token: signToken(user) },
      message: 'Login exitoso',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al iniciar sesión',
    });
  }
};

const storefront = async (req, res) => {
  try {
    const expected = process.env.STOREFRONT_SECRET || 'rendiya-storefront-dev';
    const provided = req.get('x-storefront-key') || '';
    if (!provided || provided !== expected) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'No autorizado para sincronizar el sitio',
      });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || email).trim();
    const role = req.body.role === 'admin' ? 'admin' : 'user';

    if (!email) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'email es obligatorio',
      });
    }

    let user = await User.unscoped().findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
        role,
      });
    } else if (role === 'admin' && user.role !== 'admin') {
      await user.update({ role: 'admin', name: name || user.name });
    }

    const safeUser = user.get({ plain: true });
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      data: { user: safeUser, token: signToken(user) },
      message: 'Sesión de reservas sincronizada',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al sincronizar el sitio',
    });
  }
};

module.exports = { register, login, storefront };
