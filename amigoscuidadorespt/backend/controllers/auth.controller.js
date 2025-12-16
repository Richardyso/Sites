const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { sendWelcomeEmail } = require('../services/emailService');

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Registro de novo usuário
exports.register = async (req, res) => {
  try {
    const { name, email, password, userType, phone, address, ...professionalData } = req.body;

    // Criar novo usuário
    const newUser = await User.create({
      name,
      email,
      password,
      userType,
      phone,
      address,
      ...professionalData
    });

    // Gerar token
    const token = generateToken(newUser.id);

    // Enviar email de boas-vindas (aguardar para garantir execução em serverless)
    console.log('[Register] Tentando enviar email de boas-vindas...');
    try {
      const info = await sendWelcomeEmail({
        name: newUser.name,
        email: newUser.email,
        userType: newUser.userType
      });
      console.log('[Register] ✅ Email de boas-vindas enviado com sucesso!');
      if (info?.messageId) {
        console.log('[Register] Message ID:', info.messageId);
      }
    } catch (error) {
      console.error('[Register] ❌ ERRO COMPLETO ao enviar email de boas-vindas:');
      console.error('[Register] Mensagem:', error.message);
      console.error('[Register] Stack:', error.stack);
      console.error('[Register] Código:', error.code);
      console.error('[Register] Response:', error.response);
    }

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao registrar usuário'
    });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário por email
    const user = await User.findByEmail(email);
    console.log('Login attempt - Email:', email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    console.log('Password provided:', password);
    console.log('Password stored:', user.password);
    const isPasswordValid = await User.verifyPassword(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    // Remover senha do objeto do usuário
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login'
    });
  }
};

// Logout (opcional - gerenciado no frontend)
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
};

// Verificar token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Buscar usuário
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Remover senha
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        valid: true
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
};
