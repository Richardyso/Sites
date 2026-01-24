// ===== ROTAS DE USUÁRIO LOCAL =====

const express = require('express');
const router = express.Router();
const { verifyLocalToken } = require('../middleware/authLocal');

// Função para obter o banco de dados dinamicamente (chamada em runtime)
const getDb = () => {
    if (global.db) {
        return global.db;
    }
    return require('../config/database-local');
};

// Tamanho máximo da imagem em bytes (1MB)
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

// ===== GET /api/user/profile =====
// Retorna o perfil completo do usuário autenticado
router.get('/profile', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getUserById, log } = db;
    
    try {
        log('info', `GET /api/user/profile - Usuário: ${req.user.email}`);
        
        const user = await getUserById(req.user.uid);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Remover senha antes de enviar
        const { password, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            user: userWithoutPassword
        });
        
    } catch (error) {
        log('error', 'Erro ao buscar perfil', error);
        res.status(500).json({ 
            error: 'Erro ao buscar perfil',
            message: error.message 
        });
    }
});

// ===== PUT /api/user/profile =====
// Atualiza o perfil do usuário (incluindo imagem)
router.put('/profile', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getUserById, updateUser, log } = db;
    
    try {
        const { name, preferredColor, focusArea, profileImage, emailPreferences } = req.body;
        
        log('info', `PUT /api/user/profile - Atualizando usuário: ${req.user.email}`);
        
        const updates = {};
        
        // Validar e atualizar nome
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length < 2) {
                return res.status(400).json({ 
                    error: 'Nome inválido',
                    message: 'O nome deve ter pelo menos 2 caracteres' 
                });
            }
            updates.name = name.trim();
        }
        
        // Validar e atualizar cor preferida
        if (preferredColor !== undefined) {
            // Validar formato de cor hex
            const colorRegex = /^#[0-9A-Fa-f]{6}$/;
            if (!colorRegex.test(preferredColor)) {
                return res.status(400).json({ 
                    error: 'Cor inválida',
                    message: 'A cor deve estar no formato hexadecimal (#RRGGBB)' 
                });
            }
            updates.preferredColor = preferredColor;
        }
        
        // Validar e atualizar área de foco
        if (focusArea !== undefined) {
            const validAreas = ['Mental', 'Físico', 'Emocional', 'Espiritual', 'Financeiro', 'Aparência'];
            if (!validAreas.includes(focusArea)) {
                return res.status(400).json({ 
                    error: 'Área de foco inválida',
                    message: `A área de foco deve ser uma das seguintes: ${validAreas.join(', ')}` 
                });
            }
            updates.focusArea = focusArea;
        }
        
        // Atualizar preferências de email
        if (emailPreferences !== undefined) {
            updates.emailPreferences = emailPreferences;
        }
        
        // Validar e atualizar imagem de perfil
        if (profileImage !== undefined) {
            if (profileImage === null) {
                // Remover imagem
                updates.profileImage = null;
                log('info', 'Removendo imagem de perfil do usuário');
            } else if (typeof profileImage === 'string') {
                // Validar se é base64 válido
                if (!profileImage.startsWith('data:image/')) {
                    return res.status(400).json({ 
                        error: 'Imagem inválida',
                        message: 'A imagem deve estar em formato base64 válido' 
                    });
                }
                
                // Verificar tamanho
                const base64Data = profileImage.split(',')[1] || profileImage;
                const sizeInBytes = (base64Data.length * 3) / 4;
                
                if (sizeInBytes > MAX_IMAGE_SIZE) {
                    return res.status(400).json({ 
                        error: 'Imagem muito grande',
                        message: 'A imagem deve ter no máximo 1MB' 
                    });
                }
                
                updates.profileImage = profileImage;
                log('info', `Atualizando imagem de perfil (${(sizeInBytes / 1024).toFixed(2)}KB)`);
            }
        }
        
        // Verificar se há algo para atualizar
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                error: 'Nenhum dado para atualizar',
                message: 'Envie pelo menos um campo para atualizar' 
            });
        }
        
        // Adicionar timestamp de atualização
        updates.updatedAt = new Date().toISOString();
        
        // Atualizar no banco
        await updateUser(req.user.uid, updates);
        
        // Buscar usuário atualizado
        const updatedUser = await getUserById(req.user.uid);
        const { password, ...userWithoutPassword } = updatedUser;
        
        log('info', `Perfil atualizado com sucesso para: ${req.user.email}`);
        
        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'Perfil atualizado com sucesso'
        });
        
    } catch (error) {
        log('error', 'Erro ao atualizar perfil', error);
        res.status(500).json({ 
            error: 'Erro ao atualizar perfil',
            message: error.message 
        });
    }
});

// ===== DELETE /api/user/profile/image =====
// Remove apenas a imagem de perfil
router.delete('/profile/image', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getUserById, updateUser, log } = db;
    
    try {
        log('info', `DELETE /api/user/profile/image - Usuário: ${req.user.email}`);
        
        await updateUser(req.user.uid, { 
            profileImage: null,
            updatedAt: new Date().toISOString()
        });
        
        const updatedUser = await getUserById(req.user.uid);
        const { password, ...userWithoutPassword } = updatedUser;
        
        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'Imagem removida com sucesso'
        });
        
    } catch (error) {
        log('error', 'Erro ao remover imagem', error);
        res.status(500).json({ 
            error: 'Erro ao remover imagem',
            message: error.message 
        });
    }
});

module.exports = router;
