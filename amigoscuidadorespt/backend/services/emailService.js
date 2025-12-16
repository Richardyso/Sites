const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!config.email.user || !config.email.pass) {
    console.warn('[EmailService] Credenciais de email não configuradas. Emails não serão enviados.');
    console.warn('[EmailService] User:', config.email.user, 'Pass:', config.email.pass ? '***' : 'não definida');
    return null;
  }

  console.log('[EmailService] Configurando transporte de email...');
  console.log('[EmailService] Host:', config.email.host);
  console.log('[EmailService] Port:', config.email.port);
  console.log('[EmailService] User:', config.email.user);
  console.log('[EmailService] Pass disponível?:', config.email.pass ? 'SIM (***' + config.email.pass.slice(-4) + ')' : 'NÃO - FALTANDO!');

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    requireTLS: true, // Força STARTTLS na porta 587
    auth: {
      user: config.email.user,
      pass: config.email.pass
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 10000,
    logger: true, // logs detalhados
    debug: process.env.NODE_ENV === 'development' // debug em dev
  });

  console.log('[EmailService] Transporte de email configurado com sucesso!');
  return transporter;
}

async function sendMail(options) {
  const mailer = getTransporter();
  if (!mailer) {
    console.error('[EmailService] Transporter não configurado. Email não será enviado.');
    throw new Error('Email não configurado');
  }

  const message = {
    from: config.email.from,
    ...options
  };

  console.log('[EmailService] Enviando email...');
  console.log('[EmailService] Para:', options.to);
  console.log('[EmailService] Assunto:', options.subject);

  try {
    console.log('[EmailService] Iniciando envio...');
    console.log('[EmailService] Tentando conectar ao servidor SMTP...');
    
    const info = await Promise.race([
      mailer.sendMail(message),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT: Email demorou mais de 15 segundos')), 15000)
      )
    ]);
    
    console.log('[EmailService] ✅ Email enviado com sucesso!');
    console.log('[EmailService] Message ID:', info.messageId);
    console.log('[EmailService] Response:', info.response);
    return info;
  } catch (error) {
    console.error('[EmailService] ❌ ERRO AO ENVIAR EMAIL:');
    console.error('[EmailService] Mensagem:', error.message);
    console.error('[EmailService] Código:', error.code);
    console.error('[EmailService] Command:', error.command);
    console.error('[EmailService] Response:', error.response);
    console.error('[EmailService] ResponseCode:', error.responseCode);
    console.error('[EmailService] Stack completo:', error.stack);
    throw error;
  }
}

async function sendWelcomeEmail({ name, email, userType }) {
  const firstName = name?.split(' ')[0] || 'Olá';
  
  // Definir tipo de usuário em português
  const userTypeLabels = {
    'client': 'Cliente',
    'caregiver': 'Cuidador',
    'nurse': 'Enfermeiro',
    'admin': 'Administrador'
  };
  const userTypeLabel = userTypeLabels[userType] || 'Usuário';

  // Mensagem personalizada baseada no tipo de usuário
  let personalizatedMessage = '';
  let nextSteps = '';

  if (userType === 'caregiver' || userType === 'nurse') {
    personalizatedMessage = `
      <p style="margin: 16px 0; font-size: 15px; color: #334155;">
        Você se cadastrou como <strong style="color: #2563eb;">${userTypeLabel}</strong>. 
        Seja muito bem-vindo(a) à nossa plataforma!
      </p>
    `;
    nextSteps = `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">⚠️ Importante - Próximos Passos:</h3>
        <ol style="margin: 8px 0; padding-left: 20px; color: #78350f;">
          <li style="margin-bottom: 8px;">
            <strong>Complete seu perfil:</strong> Adicione sua biografia, especialidades, taxa por hora e disponibilidade.
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Envie sua documentação:</strong> Acesse "Meus Documentos" e faça upload dos seguintes documentos:
            <ul style="margin-top: 6px;">
              <li>Documentos pessoais (RG, CPF, CNH)</li>
              <li>Certificado de Antecedentes Criminais</li>
              <li>Referências profissionais</li>
            </ul>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Aguarde a ativação:</strong> Nossa equipe irá revisar seus dados e documentos. 
            Assim que aprovado, seu perfil ficará visível para os clientes!
          </li>
        </ol>
        <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e;">
          📌 <strong>Atenção:</strong> Você só aparecerá nos resultados de busca após completar seu perfil 
          e ter sua documentação aprovada pela nossa equipe.
        </p>
      </div>
    `;
  } else if (userType === 'client') {
    personalizatedMessage = `
      <p style="margin: 16px 0; font-size: 15px; color: #334155;">
        Você se cadastrou como <strong style="color: #2563eb;">${userTypeLabel}</strong>. 
        Estamos felizes em ajudá-lo(a) a encontrar o cuidador ideal!
      </p>
    `;
    nextSteps = `
      <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">🎯 Próximos Passos:</h3>
        <ol style="margin: 8px 0; padding-left: 20px; color: #1e3a8a;">
          <li style="margin-bottom: 8px;">
            <strong>Complete seu perfil:</strong> Adicione seus dados de contato e localização.
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Busque cuidadores:</strong> Use nossa ferramenta de busca para encontrar profissionais qualificados.
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Entre em contato:</strong> Visualize perfis, veja avaliações e escolha o melhor cuidador para você.
          </li>
        </ol>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-family: Arial, sans-serif;">
                    👋 Bem-vindo(a)!
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 16px; font-family: Arial, sans-serif;">
                    Amigos Cuidadores
                  </p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px; font-family: Arial, sans-serif;">
                  <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px;">
                    Olá, ${firstName}!
                  </h2>
                  
                  <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                    Estamos muito felizes em tê-lo(a) conosco! Seu cadastro foi realizado com sucesso.
                  </p>
                  
                  ${personalizatedMessage}
                  
                  ${nextSteps}
                  
                  <div style="background: #f8fafc; border-radius: 6px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px 0; color: #334155; font-size: 14px;">
                      <strong style="color: #0f172a;">📧 Seu email de acesso:</strong><br>
                      <span style="color: #2563eb;">${email}</span>
                    </p>
                    <p style="margin: 0; color: #334155; font-size: 14px;">
                      <strong style="color: #0f172a;">🔐 Sua senha:</strong><br>
                      <span style="color: #64748b;">A senha que você cadastrou</span>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="http://localhost:3000/dashboard.html" 
                       style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; 
                              padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 15px;">
                      Acessar Dashboard
                    </a>
                  </div>
                  
                  <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Se precisar de ajuda, nossa equipe está à disposição. Responda este email ou entre em contato conosco.
                  </p>
                  
                  <p style="margin: 20px 0 0 0; color: #0f172a; font-size: 15px;">
                    Com carinho,<br>
                    <strong style="color: #2563eb;">Equipe Amigos Cuidadores</strong> 💙
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center; line-height: 1.5;">
                    Se você não solicitou este cadastro, por favor ignore esta mensagem.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px; text-align: center;">
                    © 2025 Amigos Cuidadores - Cuidando com amor e profissionalismo
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const subject = userType === 'caregiver' || userType === 'nurse' 
    ? `Bem-vindo(a), ${userTypeLabel}! Complete seu cadastro` 
    : `Bem-vindo(a) ao Amigos Cuidadores, ${firstName}!`;

  await sendMail({
    to: email,
    subject,
    html
  });
}

async function sendPasswordResetEmail({ name, email, code }) {
  const firstName = name?.split(' ')[0] || 'Olá';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-family: Arial, sans-serif;">
                    🔐 Recuperação de Senha
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #fee2e2; font-size: 16px; font-family: Arial, sans-serif;">
                    Amigos Cuidadores
                  </p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px; font-family: Arial, sans-serif;">
                  <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px;">
                    Olá, ${firstName}!
                  </h2>
                  
                  <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                    Recebemos uma solicitação para redefinir a senha da sua conta.
                  </p>
                  
                  <p style="margin: 16px 0; font-size: 15px; color: #334155;">
                    Use o código abaixo para criar uma nova senha:
                  </p>
                  
                  <!-- Código de Verificação -->
                  <div style="background: #fef3c7; border: 2px dashed #f59e0b; padding: 24px; margin: 24px 0; text-align: center; border-radius: 8px;">
                    <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 18px;">
                      Seu Código de Verificação
                    </h3>
                    <div style="font-size: 36px; font-weight: bold; color: #ef4444; letter-spacing: 8px; margin: 16px 0;">
                      ${code}
                    </div>
                    <p style="margin: 16px 0 0 0; color: #78350f; font-size: 13px;">
                      ⏰ Este código é válido por <strong>15 minutos</strong>
                    </p>
                  </div>
                  
                  <div style="background: #f8fafc; border-radius: 6px; padding: 20px; margin: 24px 0;">
                    <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px;">
                      📝 Como redefinir sua senha:
                    </h4>
                    <ol style="margin: 8px 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                      <li>Acesse a página de redefinição de senha</li>
                      <li>Digite seu email: <strong style="color: #2563eb;">${email}</strong></li>
                      <li>Insira o código: <strong style="color: #ef4444;">${code}</strong></li>
                      <li>Crie uma nova senha segura</li>
                    </ol>
                  </div>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="http://localhost:3000/reset-password.html" 
                       style="display: inline-block; background: #ef4444; color: #ffffff; text-decoration: none; 
                              padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 15px;">
                      Redefinir Minha Senha
                    </a>
                  </div>
                  
                  <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>⚠️ Importante:</strong> Se você não solicitou esta alteração de senha, 
                      ignore este email. Sua conta permanecerá segura.
                    </p>
                  </div>
                  
                  <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Se tiver problemas, entre em contato com nosso suporte pelo WhatsApp: 
                    <a href="https://wa.me/351910474651" style="color: #2563eb; text-decoration: none;">+351 910 474 651</a>
                  </p>
                  
                  <p style="margin: 20px 0 0 0; color: #0f172a; font-size: 15px;">
                    Atenciosamente,<br>
                    <strong style="color: #2563eb;">Equipe Amigos Cuidadores</strong> 💙
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center; line-height: 1.5;">
                    Este é um email automático. Por favor, não responda.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px; text-align: center;">
                    © 2025 Amigos Cuidadores - Cuidando com amor e profissionalismo
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: `🔐 Código de Recuperação: ${code} - Amigos Cuidadores`,
    html
  });
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};

