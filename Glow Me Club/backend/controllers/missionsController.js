// ===== CONTROLADOR DE MISSÕES =====
const { firestore, serverTimestamp, increment } = require('../config/firebase-admin');
const { checkLevelUp } = require('../utils/calculateLevel');
const { sendLevelUpEmail } = require('../utils/email');

// Missões padrão diárias
const DEFAULT_DAILY_MISSIONS = [
    {
        description: 'Beber 2L de água',
        pointsEarned: 10,
        category: 'Físico',
        icon: '💧'
    },
    {
        description: 'Fazer 10 min de alongamento',
        pointsEarned: 15,
        category: 'Físico',
        icon: '🧘‍♀️'
    },
    {
        description: 'Escrever 3 gratidões',
        pointsEarned: 10,
        category: 'Emocional',
        icon: '🙏'
    },
    {
        description: 'Meditar 5 minutos',
        pointsEarned: 15,
        category: 'Espiritual',
        icon: '🧘'
    },
    {
        description: 'Ler 15 minutos',
        pointsEarned: 10,
        category: 'Mental',
        icon: '📚'
    }
];

/**
 * Obter data atual no formato YYYY-MM-DD
 */
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Listar missões do usuário
 */
exports.getMissions = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { date, completed } = req.query;
        
        let missionsRef = firestore
            .collection('users')
            .doc(userId)
            .collection('missions');
        
        // Filtrar por data se fornecida
        if (date) {
            missionsRef = missionsRef.where('date', '==', date);
        }
        
        // Filtrar por status se fornecido
        if (completed !== undefined) {
            missionsRef = missionsRef.where('completed', '==', completed === 'true');
        }
        
        const snapshot = await missionsRef
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const missions = [];
        snapshot.forEach(doc => {
            missions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({ missions });
        
    } catch (error) {
        console.error('Erro ao listar missões:', error);
        res.status(500).json({
            error: 'Erro ao listar missões'
        });
    }
};

/**
 * Obter missões de hoje
 */
exports.getTodayMissions = async (req, res) => {
    try {
        const userId = req.user.uid;
        const today = getTodayDate();
        
        // Verificar se já existem missões para hoje
        const todayMissions = await firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .where('date', '==', today)
            .get();
        
        // Se não existem missões para hoje, criar
        if (todayMissions.empty) {
            await createUserDailyMissions(userId);
            
            // Buscar novamente as missões criadas
            const newMissions = await firestore
                .collection('users')
                .doc(userId)
                .collection('missions')
                .where('date', '==', today)
                .get();
            
            const missions = [];
            newMissions.forEach(doc => {
                missions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return res.json({ missions, created: true });
        }
        
        // Retornar missões existentes
        const missions = [];
        todayMissions.forEach(doc => {
            missions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({ missions, created: false });
        
    } catch (error) {
        console.error('Erro ao buscar missões de hoje:', error);
        res.status(500).json({
            error: 'Erro ao buscar missões de hoje'
        });
    }
};

/**
 * Criar missões diárias para um usuário
 */
async function createUserDailyMissions(userId) {
    const today = getTodayDate();
    const batch = firestore.batch();
    
    for (const mission of DEFAULT_DAILY_MISSIONS) {
        const missionRef = firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .doc();
        
        batch.set(missionRef, {
            ...mission,
            completed: false,
            date: today,
            createdAt: serverTimestamp()
        });
    }
    
    await batch.commit();
}

/**
 * Criar missões diárias (endpoint manual ou para cron job)
 */
exports.createDailyMissions = async (req, res) => {
    try {
        const userId = req.user.uid;
        const today = getTodayDate();
        
        // Verificar se já existem missões para hoje
        const existingMissions = await firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .where('date', '==', today)
            .get();
        
        if (!existingMissions.empty) {
            return res.status(400).json({
                error: 'Missões de hoje já foram criadas'
            });
        }
        
        // Criar missões
        await createUserDailyMissions(userId);
        
        res.json({
            success: true,
            message: 'Missões diárias criadas com sucesso',
            date: today
        });
        
    } catch (error) {
        console.error('Erro ao criar missões diárias:', error);
        res.status(500).json({
            error: 'Erro ao criar missões diárias'
        });
    }
};

/**
 * Completar uma missão
 */
exports.completeMission = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        
        // Buscar a missão
        const missionRef = firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .doc(id);
        
        const missionDoc = await missionRef.get();
        
        if (!missionDoc.exists) {
            return res.status(404).json({
                error: 'Missão não encontrada'
            });
        }
        
        const missionData = missionDoc.data();
        
        if (missionData.completed) {
            return res.status(400).json({
                error: 'Missão já foi concluída'
            });
        }
        
        // Usar transação para garantir consistência
        const batch = firestore.batch();
        
        // Marcar missão como concluída
        batch.update(missionRef, {
            completed: true,
            completedAt: serverTimestamp()
        });
        
        // Buscar pontos atuais do usuário
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const currentPoints = userData.totalPoints || 0;
        const missionPoints = missionData.pointsEarned || 10;
        const newPoints = currentPoints + missionPoints;
        
        // Atualizar pontos do usuário
        batch.update(userRef, {
            totalPoints: increment(missionPoints)
        });
        
        // Adicionar ao histórico de pontos
        const historyRef = firestore
            .collection('users')
            .doc(userId)
            .collection('pointsHistory')
            .doc();
        
        batch.set(historyRef, {
            action: `Missão concluída: ${missionData.description}`,
            points: missionPoints,
            timestamp: serverTimestamp()
        });
        
        // Executar transação
        await batch.commit();
        
        // Verificar se subiu de nível
        const levelUp = checkLevelUp(currentPoints, newPoints);
        
        if (levelUp && userData.email) {
            // Enviar email de level up (não bloquear resposta)
            sendLevelUpEmail(
                userData.email,
                userData.name,
                levelUp.newLevel,
                levelUp.levelInfo.name,
                levelUp.levelInfo.message
            ).catch(err => console.error('Erro ao enviar email de level up:', err));
        }
        
        res.json({
            success: true,
            message: 'Missão concluída com sucesso!',
            pointsEarned: missionPoints,
            newTotalPoints: newPoints,
            levelUp: levelUp ? {
                newLevel: levelUp.newLevel,
                levelName: levelUp.levelInfo.name,
                message: levelUp.levelInfo.message
            } : null
        });
        
    } catch (error) {
        console.error('Erro ao completar missão:', error);
        res.status(500).json({
            error: 'Erro ao completar missão'
        });
    }
};

/**
 * Obter estatísticas de missões
 */
exports.getMissionStats = async (req, res) => {
    try {
        const userId = req.user.uid;
        const today = getTodayDate();
        
        // Missões de hoje
        const todayMissions = await firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .where('date', '==', today)
            .get();
        
        let todayCompleted = 0;
        let todayTotal = 0;
        
        todayMissions.forEach(doc => {
            todayTotal++;
            if (doc.data().completed) todayCompleted++;
        });
        
        // Missões do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const monthMissions = await firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .where('completedAt', '>=', startOfMonth)
            .get();
        
        const monthCompleted = monthMissions.size;
        
        // Total de pontos ganhos com missões
        let totalMissionPoints = 0;
        monthMissions.forEach(doc => {
            totalMissionPoints += doc.data().pointsEarned || 0;
        });
        
        res.json({
            today: {
                completed: todayCompleted,
                total: todayTotal,
                percentage: todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0
            },
            month: {
                completed: monthCompleted,
                pointsEarned: totalMissionPoints
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas de missões:', error);
        res.status(500).json({
            error: 'Erro ao buscar estatísticas'
        });
    }
};