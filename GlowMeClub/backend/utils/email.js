// ===== UTILITÁRIO DE EMAIL - GLOWMECLUB =====
const nodemailer = require('nodemailer');

// Criar transportador de email
let transporter = null;
let transporterInitialized = false;

// Cores para logs
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

/**
 * Log formatado para emails
 */
function emailLog(type, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    let color = colors.reset;
    let emoji = '📧';
    
    switch(type) {
        case 'info': color = colors.cyan; emoji = '📧'; break;
        case 'success': color = colors.green; emoji = '✅'; break;
        case 'warning': color = colors.yellow; emoji = '⚠️'; break;
        case 'error': color = colors.red; emoji = '❌'; break;
        case 'debug': color = colors.magenta; emoji = '🔍'; break;
    }
    
    console.log(`${color}[${timestamp}] ${emoji} [EMAIL] ${message}${colors.reset}`);
    if (data) {
        if (typeof data === 'object' && data.stack) {
            // É um erro
            console.log(`${colors.red}    └─ Error: ${data.message}${colors.reset}`);
            console.log(`${colors.red}    └─ Stack: ${data.stack.split('\n')[1]}${colors.reset}`);
        } else {
            console.log(`${colors.cyan}    └─ ${JSON.stringify(data, null, 2)}${colors.reset}`);
        }
    }
}

/**
 * Inicializa o transportador de email
 */
async function initTransporter() {
    if (transporter && transporterInitialized) {
        emailLog('debug', 'Transportador já inicializado, reutilizando...');
        return transporter;
    }
    
    emailLog('info', '=== INICIALIZANDO SISTEMA DE EMAIL ===');
    
    // Log das variáveis de ambiente
    emailLog('debug', 'Verificando variáveis de ambiente:', {
        SMTP_HOST: process.env.SMTP_HOST || '(não definido)',
        SMTP_PORT: process.env.SMTP_PORT || '(não definido)',
        SMTP_SECURE: process.env.SMTP_SECURE || '(não definido)',
        SMTP_USER: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 5)}...` : '(não definido)',
        SMTP_PASS: process.env.SMTP_PASS ? '****(configurado)' : '(não definido)',
        NODE_ENV: process.env.NODE_ENV || '(não definido)'
    });
    
    // Verificar se estamos em produção ou se temos credenciais SMTP
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        emailLog('info', 'Credenciais SMTP encontradas, configurando Gmail...');
        
        const smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // Debug adicional
            debug: true,
            logger: false
        };
        
        emailLog('debug', 'Configuração SMTP:', {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            user: smtpConfig.auth.user
        });
        
        transporter = nodemailer.createTransport(smtpConfig);
        
        // Verificar conexão
        try {
            emailLog('info', 'Verificando conexão SMTP...');
            await transporter.verify();
            emailLog('success', 'Conexão SMTP verificada com sucesso!');
            transporterInitialized = true;
        } catch (error) {
            emailLog('error', 'Falha na verificação SMTP:', error);
            emailLog('warning', 'O sistema continuará, mas emails podem falhar');
        }
    } else {
        emailLog('warning', 'Credenciais SMTP não encontradas!');
        emailLog('info', 'Tentando configurar conta de teste Ethereal...');
        
        // Desenvolvimento - usar Ethereal Email (fake SMTP)
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            
            emailLog('success', 'Email de teste configurado (Ethereal):', {
                user: testAccount.user,
                web: 'https://ethereal.email/messages'
            });
            transporterInitialized = true;
        } catch (error) {
            emailLog('error', 'Erro ao criar conta de teste:', error);
        }
    }
    
    return transporter;
}

// Inicializar na carga do módulo
initTransporter().then(() => {
    emailLog('info', '=== SISTEMA DE EMAIL PRONTO ===');
}).catch(err => {
    emailLog('error', 'Falha ao inicializar sistema de email:', err);
});

/**
 * Template base para emails - Estilo fofo GlowMeClub
 */
const emailTemplate = (content) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Poppins', 'Arial', sans-serif;
            line-height: 1.7;
            color: #4a4a4a;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(139, 92, 246, 0.15);
        }
        .header {
            background: linear-gradient(135deg, #8B5CF6, #A78BFA, #C4B5FD);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header .subtitle {
            margin-top: 8px;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 35px;
        }
        .content h2 {
            color: #7C3AED;
            margin-top: 0;
        }
        .content p {
            margin: 15px 0;
        }
        .highlight-box {
            background: linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%);
            border-left: 4px solid #8B5CF6;
            padding: 20px;
            border-radius: 0 12px 12px 0;
            margin: 25px 0;
        }
        .code-box {
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            margin: 25px 0;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        .code-box .code {
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .code-box .label {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 8px;
        }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
            color: white !important;
            text-decoration: none;
            border-radius: 30px;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #faf5ff;
            padding: 25px;
            text-align: center;
            font-size: 13px;
            color: #888;
            border-top: 1px solid #f0e7ff;
        }
        .footer .brand {
            color: #8B5CF6;
            font-weight: 600;
        }
        .emoji {
            font-size: 20px;
            margin: 0 3px;
        }
        ul {
            padding-left: 20px;
        }
        ul li {
            margin: 10px 0;
        }
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px dashed #e0d4f7;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
        <div class="footer">
            <p class="brand">✨ GlowMeClub ✨</p>
            <p>Teu glow. Teu ritmo. Teu processo.</p>
            <p style="font-size: 11px; margin-top: 15px; color: #aaa;">
                Este email foi enviado automaticamente.<br>
                Por favor, não responda diretamente a este email.
            </p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Enviar email de boas-vindas
 */
async function sendWelcomeEmail(userEmail, userName) {
    emailLog('info', '=== ENVIANDO EMAIL DE BOAS-VINDAS ===');
    emailLog('debug', 'Parâmetros recebidos:', { userEmail, userName });
    
    try {
        emailLog('info', 'Inicializando transportador...');
        await initTransporter();
        
        if (!transporter) {
            emailLog('error', 'Transportador de email não está configurado!');
            return null;
        }
        
        emailLog('success', 'Transportador pronto');
        
        const firstName = userName.split(' ')[0];
        emailLog('debug', 'Primeiro nome extraído:', firstName);
        
        const content = `
            <div class="header">
                <h1>🌸 Bem-vinda ao GlowMeClub! 🌸</h1>
                <div class="subtitle">Sua jornada de autocuidado começa agora</div>
            </div>
            <div class="content">
                <h2>Oiii, ${firstName} maravilhosa! 💜</h2>
                
                <p>Que alegria ter você aqui com a gente! <span class="emoji">✨</span></p>
                
                <p>Você acabou de dar o primeiro passo para uma jornada incrível de 
                autocuidado e evolução pessoal. Estamos muito felizes em te acompanhar nessa!</p>
                
                <div class="highlight-box">
                    <strong>💎 Lembra sempre:</strong><br>
                    <em>"Toda rainha começa como plebeia, mas com consistência e amor próprio, 
                    tu chegas ao teu glow natural!"</em>
                </div>
                
                <p><strong>Aqui estão algumas dicas para você arrasar:</strong></p>
                <ul>
                    <li>🎯 <strong>Defina suas metas</strong> - Comece com pequenos passos</li>
                    <li>⭐ <strong>Complete missões diárias</strong> - Ganhe pontos todos os dias</li>
                    <li>👑 <strong>Suba de nível</strong> - De Plebeia até Deusa!</li>
                    <li>🎁 <strong>Resgate recompensas</strong> - Você merece, maravilhosa!</li>
                </ul>
                
                <center>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/dashboard.html" class="button">
                        🚀 Começar minha jornada
                    </a>
                </center>
                
                <div class="signature">
                    <p>Com muito carinho e torcendo por você,</p>
                    <p><strong>💜 Equipe GlowMeClub</strong></p>
                    <p><em>P.S.: Qualquer dúvida, estamos aqui pra te ajudar! 🌟</em></p>
                </div>
            </div>
        `;
        
        const mailOptions = {
            from: `"GlowMeClub" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: '🌸 Bem-vinda ao GlowMeClub, maravilhosa! ✨',
            html: emailTemplate(content)
        };
        
        emailLog('debug', 'Opções do email:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            htmlLength: mailOptions.html.length
        });
        
        emailLog('info', 'Enviando email via SMTP...');
        const info = await transporter.sendMail(mailOptions);
        
        emailLog('success', 'Email de boas-vindas enviado com sucesso!', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });
        
        // Em desenvolvimento, mostrar URL para visualizar
        if (!process.env.SMTP_USER) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            emailLog('info', 'Preview URL (Ethereal):', previewUrl);
        }
        
        return info;
        
    } catch (error) {
        emailLog('error', 'Falha ao enviar email de boas-vindas:', error);
        emailLog('debug', 'Detalhes do erro:', {
            name: error.name,
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode
        });
        // Não lançar erro para não bloquear o cadastro
        return null;
    }
}

/**
 * Enviar email com código de recuperação de senha
 */
async function sendPasswordResetCode(userEmail, userName, resetCode) {
    emailLog('info', '=== ENVIANDO EMAIL DE RECUPERAÇÃO DE SENHA ===');
    emailLog('debug', 'Parâmetros:', { userEmail, userName, resetCode: '******' });
    
    try {
        await initTransporter();
        
        if (!transporter) {
            emailLog('error', 'Transportador não configurado!');
            return null;
        }
        
        const firstName = userName ? userName.split(' ')[0] : 'Maravilhosa';
        
        const content = `
            <div class="header">
                <h1>🔐 Recuperação de Senha</h1>
                <div class="subtitle">Vamos te ajudar a voltar!</div>
            </div>
            <div class="content">
                <h2>Oi, ${firstName}! 💜</h2>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no GlowMeClub.</p>
                
                <p>Use o código abaixo para criar uma nova senha:</p>
                
                <div class="code-box">
                    <div class="code">${resetCode}</div>
                    <div class="label">Seu código de verificação</div>
                </div>
                
                <div class="highlight-box">
                    <strong>⏰ Importante:</strong><br>
                    Este código expira em <strong>15 minutos</strong> por questões de segurança.
                </div>
                
                <p>Se você não solicitou essa alteração, pode ignorar este email com segurança. 
                Sua senha atual continuará funcionando normalmente.</p>
                
                <div class="signature">
                    <p>Estamos aqui pra te ajudar, maravilhosa! 🌟</p>
                    <p><strong>💜 Equipe GlowMeClub</strong></p>
                </div>
            </div>
        `;
        
        const mailOptions = {
            from: `"GlowMeClub" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: '🔐 Seu código de recuperação - GlowMeClub',
            html: emailTemplate(content)
        };
        
        emailLog('info', 'Enviando email de recuperação...');
        const info = await transporter.sendMail(mailOptions);
        
        emailLog('success', 'Email de recuperação enviado!', {
            messageId: info.messageId,
            accepted: info.accepted
        });
        
        if (!process.env.SMTP_USER) {
            emailLog('info', 'Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return info;
        
    } catch (error) {
        emailLog('error', 'Falha ao enviar email de recuperação:', error);
        throw error;
    }
}

/**
 * Enviar email de confirmação de senha alterada
 */
async function sendPasswordChangedEmail(userEmail, userName) {
    emailLog('info', '=== ENVIANDO EMAIL DE CONFIRMAÇÃO DE SENHA ===');
    
    try {
        await initTransporter();
        
        if (!transporter) {
            emailLog('error', 'Transportador não configurado!');
            return null;
        }
        
        const firstName = userName ? userName.split(' ')[0] : 'Maravilhosa';
        
        const content = `
            <div class="header">
                <h1>✅ Senha Alterada com Sucesso!</h1>
            </div>
            <div class="content">
                <h2>Oi, ${firstName}! 💜</h2>
                
                <p>Passando aqui pra confirmar que sua senha foi alterada com sucesso! <span class="emoji">🎉</span></p>
                
                <div class="highlight-box">
                    <strong>📅 Data da alteração:</strong><br>
                    ${new Date().toLocaleString('pt-BR', { 
                        dateStyle: 'full', 
                        timeStyle: 'short' 
                    })}
                </div>
                
                <p>Se você <strong>não</strong> fez essa alteração, entre em contato conosco imediatamente 
                para proteger sua conta.</p>
                
                <center>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/login.html" class="button">
                        🔑 Fazer login
                    </a>
                </center>
                
                <div class="signature">
                    <p>Cuide-se, maravilhosa! 🌟</p>
                    <p><strong>💜 Equipe GlowMeClub</strong></p>
                </div>
            </div>
        `;
        
        const mailOptions = {
            from: `"GlowMeClub" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: '✅ Sua senha foi alterada - GlowMeClub',
            html: emailTemplate(content)
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        emailLog('success', 'Email de confirmação de senha enviado!', { messageId: info.messageId });
        
        return info;
        
    } catch (error) {
        emailLog('error', 'Falha ao enviar email de confirmação:', error);
        return null;
    }
}

/**
 * Enviar email de recompensa resgatada
 */
async function sendRewardEmail(userEmail, userName, rewardData) {
    emailLog('info', '=== ENVIANDO EMAIL DE RECOMPENSA ===');
    emailLog('debug', 'Recompensa:', rewardData.title);
    
    try {
        await initTransporter();
        
        if (!transporter) {
            emailLog('error', 'Transportador não configurado!');
            return null;
        }
        
        const firstName = userName ? userName.split(' ')[0] : 'Maravilhosa';
        const { title, description, link, instructions } = rewardData;
        
        // URL do botão - usar link da recompensa se existir
        const buttonUrl = link || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/recompensas.html`;
        const buttonText = link ? '🎁 Acesse sua recompensa' : '🎁 Ver minhas recompensas';
        
        const content = `
            <div class="header">
                <h1>🎁 Parabéns pela Recompensa!</h1>
                <div class="subtitle">Você mereceu, maravilhosa!</div>
            </div>
            <div class="content">
                <h2>Aeee, ${firstName}! 🎉💜</h2>
                
                <p>Você acabou de resgatar uma recompensa incrível! Tô muito feliz por você!</p>
                
                <div class="code-box" style="background: linear-gradient(135deg, #10B981, #059669);">
                    <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">🎁 ${title}</div>
                    ${description ? `<div style="font-size: 14px; opacity: 0.9; font-weight: 400;">${description}</div>` : ''}
                </div>
                
                ${instructions ? `
                <div class="highlight-box">
                    <strong>📋 Como acessar sua recompensa:</strong><br><br>
                    ${instructions}
                </div>
                ` : ''}
                
                <p>Continue completando missões e metas para ganhar mais pontos e 
                desbloquear recompensas ainda mais incríveis!</p>
                
                <center>
                    <a href="${buttonUrl}" class="button">
                        ${buttonText}
                    </a>
                </center>
                
                <div class="signature">
                    <p>Você tá arrasando, maravilhosa! 🌟</p>
                    <p><strong>💜 Equipe GlowMeClub</strong></p>
                </div>
            </div>
        `;
        
        const mailOptions = {
            from: `"GlowMeClub" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `🎁 ${title} - Sua recompensa chegou!`,
            html: emailTemplate(content)
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        emailLog('success', 'Email de recompensa enviado!', { messageId: info.messageId });
        
        return info;
        
    } catch (error) {
        emailLog('error', 'Falha ao enviar email de recompensa:', error);
        return null;
    }
}

/**
 * Enviar email de level up
 */
async function sendLevelUpEmail(userEmail, userName, newLevel, levelName, levelMessage) {
    emailLog('info', '=== ENVIANDO EMAIL DE LEVEL UP ===');
    emailLog('debug', 'Novo nível:', { newLevel, levelName });
    
    try {
        await initTransporter();
        
        if (!transporter) {
            emailLog('error', 'Transportador não configurado!');
            return null;
        }
        
        const firstName = userName ? userName.split(' ')[0] : 'Maravilhosa';
        
        const levelEmojis = {
            1: '🌱',
            2: '🌿',
            3: '🌸',
            4: '👑',
            5: '✨'
        };
        
        const emoji = levelEmojis[newLevel] || '💎';
        
        const content = `
            <div class="header">
                <h1>${emoji} Você Subiu de Nível! ${emoji}</h1>
                <div class="subtitle">Que orgulho de você, maravilhosa!</div>
            </div>
            <div class="content">
                <h2>PARABÉNS, ${firstName}! 🎉💜</h2>
                
                <p>Você está evoluindo muito! Olha só o que você conquistou:</p>
                
                <div class="code-box">
                    <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
                    <div style="font-size: 24px; font-weight: 700;">Nível ${newLevel}</div>
                    <div style="font-size: 18px; margin-top: 5px;">${levelName}</div>
                </div>
                
                <div class="highlight-box">
                    <em>"${levelMessage || 'Cada passo te aproxima do seu melhor eu!'}"</em>
                </div>
                
                <p>Sua dedicação e consistência estão dando resultados lindos! 
                Continue assim que o próximo nível já tá chegando!</p>
                
                <center>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/perfil.html" class="button">
                        👑 Ver meu perfil
                    </a>
                </center>
                
                <div class="signature">
                    <p>O glow tá cada vez mais natural! ✨</p>
                    <p><strong>💜 Equipe GlowMeClub</strong></p>
                </div>
            </div>
        `;
        
        const mailOptions = {
            from: `"GlowMeClub" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `${emoji} Parabéns! Você é agora ${levelName}! - GlowMeClub`,
            html: emailTemplate(content)
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        emailLog('success', 'Email de level up enviado!', { messageId: info.messageId });
        
        return info;
        
    } catch (error) {
        emailLog('error', 'Falha ao enviar email de level up:', error);
        return null;
    }
}

/**
 * Enviar resumo semanal
 */
async function sendWeeklySummaryEmail(userEmail, userName, weeklyData) {
    emailLog('info', '=== ENVIANDO RESUMO SEMANAL ===');
    
    try {
        await initTransporter();
        
        if (!transporter) {
            emailLog('error', 'Transportador não configurado!');
            return null;
        }
        
        const firstName = userName ? userName.split(' ')[0] : 'Maravilhosa';
        
        const content = `
            <div class="header">
                <h1>📊 Seu Resumo Semanal</h1>
                <div class="subtitle">Olha só como você evoluiu essa semana!</div>
            </div>
            <div class="content">
                <h2>Oi, ${firstName} maravilhosa! 💜</h2>
                
                <p>Passando pra te contar como foi sua semana no GlowMeClub! ✨</p>
                
                <div class="highlight-box">
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 32px; font-weight: 700; color: #8B5CF6;">${weeklyData.pointsEarned || 0}</div>
                            <div style="font-size: 12px; color: #666;">Pontos ganhos</div>
                        </div>
                        <div>
                            <div style="font-size: 32px; font-weight: 700; color: #10B981;">${weeklyData.missionsCompleted || 0}</div>
                            <div style="font-size: 12px; color: #666;">Missões completas</div>
                        </div>
                        <div>
                            <div style="font-size: 32px; font-weight: 700; color: #F59E0B;">${weeklyData.streak || 0}</div>
                            <div style="font-size: 12px; color: #666;">Dias de streak</div>
                        </div>
                    </div>
                </div>
                
                ${weeklyData.goalsCompleted > 0 ? `
                <p>🎯 Você completou <strong>${weeklyData.goalsCompleted} meta(s)</strong> essa semana! Parabéns!</p>
                ` : ''}
                
                ${weeklyData.nextReward ? `
                <div class="highlight-box" style="border-left-color: #F59E0B;">
                    <strong>🎁 Quase lá!</strong><br>
                    Você está a apenas <strong>${weeklyData.nextReward.pointsNeeded} pontos</strong> de resgatar "${weeklyData.nextReward.title}"!
                </div>
                ` : ''}
                
                <p>Continue assim, maravilhosa! Cada pequeno passo conta na sua jornada de autocuidado. 🌟</p>
                
                <center>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/dashboard.html" class="button">
                        🚀 Continuar minha jornada
                    </a>
                </center>
                
                <div class="signature">
                    <p>Com carinho,</p>
                    <p><strong>💜 Equipe GlowMeClub</strong></p>
                </div>
            </div>
        `;
        
        const mailOptions = {
            from: `"GlowMeClub" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: '📊 Seu resumo semanal chegou! - GlowMeClub',
            html: emailTemplate(content)
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        emailLog('success', 'Resumo semanal enviado!', { messageId: info.messageId });
        
        return info;
        
    } catch (error) {
        emailLog('error', 'Falha ao enviar resumo semanal:', error);
        return null;
    }
}

module.exports = {
    initTransporter,
    sendWelcomeEmail,
    sendPasswordResetCode,
    sendPasswordChangedEmail,
    sendRewardEmail,
    sendLevelUpEmail,
    sendWeeklySummaryEmail
};
