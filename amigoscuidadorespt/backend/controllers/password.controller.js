const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../services/emailService');

// Solicitar código de recuperação
exports.forgotPassword = async (req, res) => {
  try {
    console.log('\n[PasswordReset] ===== NOVA SOLICITAÇÃO DE RECUPERAÇÃO =====');
    console.log('[PasswordReset] Timestamp:', new Date().toISOString());
    
    const { email } = req.body;
    console.log('[PasswordReset] Email recebido:', email);

    if (!email) {
      console.log('[PasswordReset] ❌ Email não fornecido');
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Verificar se o usuário existe
    console.log('[PasswordReset] Buscando usuário no banco...');
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('[PasswordReset] ⚠️ Usuário não encontrado para o email:', email);
      // Por segurança, não revelamos se o email existe ou não
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um código de recuperação.'
      });
    }
    
    console.log('[PasswordReset] ✅ Usuário encontrado:', user.name);

    // Verificar limite de tentativas
    const canRequest = await PasswordReset.checkRateLimit(email);
    
    if (!canRequest) {
      return res.status(429).json({
        success: false,
        message: 'Muitas tentativas. Aguarde 1 hora antes de solicitar novamente.'
      });
    }

    // Gerar código e salvar no banco
    const resetData = await PasswordReset.create(email);

    // Enviar email
    try {
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        code: resetData.code
      });
      
      console.log(`[PasswordReset] ✅ Email enviado com sucesso para ${email}`);
      console.log(`[PasswordReset] Código: ${resetData.code} (válido por 15 minutos)`);
    } catch (emailError) {
      console.error('[PasswordReset] ❌ Erro ao enviar email:', emailError);
      // Em caso de erro, ainda mostrar o código no console para não bloquear o usuário
      console.log('--------------------------------------------');
      console.log('⚠️  ERRO NO ENVIO DO EMAIL - CÓDIGO DE RECUPERAÇÃO');
      console.log('--------------------------------------------');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 CÓDIGO: ${resetData.code}`);
      console.log(`⏰ Válido até: ${new Date(resetData.expiresAt).toLocaleString('pt-BR')}`);
      console.log('--------------------------------------------');
    }

    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um código de recuperação em instantes.'
    });
  } catch (error) {
    console.error('[PasswordReset] ❌ ERRO CRÍTICO ao processar recuperação:');
    console.error('[PasswordReset] Mensagem:', error.message);
    console.error('[PasswordReset] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação. Tente novamente.'
    });
  }
};

// Redefinir senha com código
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validar campos
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Validar senha
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar código
    const verification = await PasswordReset.verifyCode(email, code);
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.error
      });
    }

    // Buscar usuário
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar senha (sem hash, conforme solicitado)
    await User.update(user.id, { password: newPassword });

    // Marcar código como usado
    await PasswordReset.markAsUsed(verification.resetId);

    console.log(`[PasswordReset] Senha redefinida com sucesso para ${email}`);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login.'
    });
  } catch (error) {
    console.error('[PasswordReset] Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha. Tente novamente.'
    });
  }
};

// Verificar se código é válido (endpoint auxiliar)
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email e código são obrigatórios'
      });
    }

    const verification = await PasswordReset.verifyCode(email, code);
    
    res.json({
      success: verification.valid,
      message: verification.valid ? 'Código válido' : verification.error
    });
  } catch (error) {
    console.error('[PasswordReset] Erro ao verificar código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar código'
    });
  }
};
