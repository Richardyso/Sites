// ===== ROTAS DE MISSÕES LOCAL =====

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

// ===== GET /api/missions/daily =====
// Retorna as missões diárias do usuário
router.get('/daily', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getSubcollection, addToSubcollection, log } = db;
    
    try {
        log('info', `GET /api/missions/daily - Usuário: ${req.user.email}`);
        
        const missions = await getSubcollection(req.user.uid, 'missions');
        const today = new Date().toDateString();
        
        // Filtrar missões de hoje
        const todayMissions = missions.filter(m => {
            const missionDate = new Date(m.createdAt).toDateString();
            return missionDate === today;
        });
        
        // Se não há missões hoje, criar novas
        if (todayMissions.length === 0) {
            const newMissions = await createDailyMissions(req.user.uid, addToSubcollection, log);
            return res.json({
                success: true,
                missions: newMissions
            });
        }
        
        res.json({
            success: true,
            missions: todayMissions
        });
        
    } catch (error) {
        log('error', 'Erro ao buscar missões diárias', error);
        res.status(500).json({ 
            error: 'Erro ao buscar missões diárias',
            message: error.message 
        });
    }
});

// ===== PUT /api/missions/:missionId/complete =====
// Marca uma missão como completa e adiciona pontos
// Funciona tanto com missões do Firebase quanto com missões locais do frontend
router.put('/:missionId/complete', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getSubcollection, updateSubcollectionItem, addPoints, addToSubcollection, log } = db;
    
    try {
        const { missionId } = req.params;
        const { title, points: clientPoints } = req.body; // Receber dados do frontend
        
        log('info', `PUT /api/missions/${missionId}/complete - Usuário: ${req.user.email}`);
        
        // Tentar encontrar missão no Firebase
        const missions = await getSubcollection(req.user.uid, 'missions');
        let mission = missions.find(m => m.id === missionId);
        
        // Definir pontos (do Firebase ou do frontend)
        const pointsToAdd = mission?.points || clientPoints || 10;
        const missionTitle = mission?.title || title || `Missão ${missionId}`;
        
        // Se a missão existe no Firebase, verificar se já foi completada
        if (mission && mission.completed) {
            return res.status(400).json({ error: 'Missão já foi completada' });
        }
        
        // Se a missão existe no Firebase, marcar como completa
        if (mission) {
            await updateSubcollectionItem(req.user.uid, 'missions', missionId, { 
                completed: true,
                completedAt: new Date().toISOString()
            });
        } else {
            // Se não existe, criar registro da missão completada
            await addToSubcollection(req.user.uid, 'missions', {
                id: missionId,
                title: missionTitle,
                points: pointsToAdd,
                completed: true,
                completedAt: new Date().toISOString(),
                source: 'local' // Indica que veio do frontend
            });
        }
        
        // Adicionar pontos ao usuário
        await addPoints(req.user.uid, pointsToAdd, `Completou missão: ${missionTitle}`);
        
        log('success', `Pontos adicionados: ${pointsToAdd} para ${req.user.email}`);
        
        res.json({
            success: true,
            message: 'Missão completada com sucesso!',
            pointsEarned: pointsToAdd,
            allCompleted: false,
            bonusPoints: 0
        });
        
    } catch (error) {
        log('error', 'Erro ao completar missão', error);
        res.status(500).json({ 
            error: 'Erro ao completar missão',
            message: error.message 
        });
    }
});

// Função auxiliar para criar missões diárias
async function createDailyMissions(userId, addToSubcollection, log) {
    const missionTemplates = [
        { title: 'Momento Mindfulness', description: 'Reserve 5 minutos para respiração consciente', points: 20, icon: 'fa-spa' },
        { title: 'Gratidão Diária', description: 'Escreva 3 coisas pelas quais você é grata', points: 15, icon: 'fa-heart' },
        { title: 'Hidratação Poderosa', description: 'Beba 8 copos de água durante o dia', points: 25, icon: 'fa-tint' },
        { title: 'Movimento do Corpo', description: 'Faça 15 minutos de exercício ou alongamento', points: 30, icon: 'fa-running' },
        { title: 'Conexão Genuína', description: 'Envie uma mensagem positiva para alguém especial', points: 20, icon: 'fa-comments' },
        { title: 'Aprendizado Contínuo', description: 'Leia 10 páginas de um livro ou artigo inspirador', points: 25, icon: 'fa-book' },
        { title: 'Autocuidado', description: 'Dedique 10 minutos para sua rotina de skincare', points: 15, icon: 'fa-smile' },
        { title: 'Organização Mental', description: 'Planeje as 3 principais tarefas do dia seguinte', points: 20, icon: 'fa-tasks' }
    ];
    
    // Escolher 3 missões aleatórias
    const shuffled = [...missionTemplates].sort(() => 0.5 - Math.random());
    const selectedMissions = shuffled.slice(0, 3);
    
    const missions = [];
    for (const template of selectedMissions) {
        const mission = await addToSubcollection(userId, 'missions', {
            ...template,
            completed: false,
            createdAt: new Date().toISOString()
        });
        missions.push(mission);
    }
    
    log('info', `Criadas ${missions.length} missões diárias para usuário ${userId}`);
    
    return missions;
}

module.exports = router;
