module.exports = {
  // Configurações JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'amigos_cuidadores_secret_2025',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },
  
  // Configurações de senha
  bcrypt: {
    saltRounds: 10
  },
  
  // Configurações do servidor
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'Amigos Cuidadores <no-reply@amigoscuidadores.com>'
  }
};
