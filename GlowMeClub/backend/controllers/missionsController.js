// ===== CONTROLADOR DE MISSÕES =====
const { firestore, serverTimestamp, increment } = require('../config/firebase-admin');
const { checkLevelUp, getActionReward } = require('../utils/calculateLevel');
const { sendLevelUpEmail } = require('../utils/email');

// Missões por área de foco
const MISSIONS_BY_FOCUS_AREA = {
    Mental: [
        { description: 'Ler 10 páginas de algum livro', pointsEarned: 15, icon: '📚' },
        { description: 'Resolver um problema lógico (xadrez, sudoku, etc.)', pointsEarned: 15, icon: '🧩' },
        { description: 'Aprender algo novo por 15 minutos (vídeo/aula)', pointsEarned: 15, icon: '🎓' },
        { description: 'Escrever 10 linhas organizando pensamentos ou ideias', pointsEarned: 10, icon: '✍️' },
        { description: 'Ficar 10 minutos sem estímulos (sem celular, sem música, só pensar)', pointsEarned: 15, icon: '🧠' }
    ],
    Físico: [
        { description: 'Fazer 30 minutos de exercício (caminhada, treino)', pointsEarned: 20, icon: '🏋️' },
        { description: 'Beber 2 a 3 litros de água ao longo do dia', pointsEarned: 10, icon: '💧' },
        { description: 'Comer pelo menos 2 refeições "limpas" (sem ultraprocessado)', pointsEarned: 15, icon: '🥗' },
        { description: 'Dormir no mínimo 7 horas', pointsEarned: 15, icon: '😴' },
        { description: 'Alongar por 5 minutos antes de dormir', pointsEarned: 10, icon: '🧘‍♀️' }
    ],
    Emocional: [
        { description: 'Mandar mensagem para alguém importante', pointsEarned: 10, icon: '💬' },
        { description: 'Fazer algo que você gosta por 20 minutos (sem culpa)', pointsEarned: 15, icon: '🎨' },
        { description: 'Identificar e escrever 1 emoção sentida no dia', pointsEarned: 10, icon: '📝' },
        { description: 'Praticar 5 minutos de respiração consciente', pointsEarned: 10, icon: '🌬️' },
        { description: 'Evitar uma reclamação desnecessária', pointsEarned: 15, icon: '🙊' }
    ],
    Espiritual: [
        { description: '10 minutos de silêncio/reflexão/oração/meditação', pointsEarned: 15, icon: '🧘' },
        { description: 'Praticar um ato de bondade anônimo', pointsEarned: 20, icon: '💝' },
        { description: 'Ler um trecho de algo que eleve seu espírito (Bíblia, filosofia, etc.)', pointsEarned: 15, icon: '📖' },
        { description: 'Agradecer por 3 coisas do dia', pointsEarned: 10, icon: '🙏' },
        { description: 'Observar o céu/natureza por 10 minutos com presença total', pointsEarned: 15, icon: '🌅' }
    ],
    Financeiro: [
        { description: 'Anotar todos os gastos do dia', pointsEarned: 10, icon: '📊' },
        { description: 'Pensar em 1 forma de gerar mais renda (ideia ou ação)', pointsEarned: 15, icon: '💡' },
        { description: 'Estudar 30 minutos sobre finanças/investimentos', pointsEarned: 20, icon: '📈' },
        { description: 'Cortar 1 gasto desnecessário', pointsEarned: 15, icon: '✂️' },
        { description: 'Fazer 1 ação que aproxime de uma meta financeira', pointsEarned: 15, icon: '🎯' }
    ],
    Aparência: [
        { description: 'Skincare', pointsEarned: 10, icon: '🧴' },
        { description: 'Manter postura ereta ao caminhar e sentar', pointsEarned: 10, icon: '🚶‍♀️' },
        { description: 'Se arrumar bem até pra ficar em casa', pointsEarned: 10, icon: '👗' },
        { description: 'Cuidar do cabelo/unhas', pointsEarned: 10, icon: '💅' },
        { description: 'Investir em você (descobrir o que mais valoriza você, exemplo roupas, maquiagem etc)', pointsEarned: 15, icon: '✨' }
    ]
};

// Fallback para área não especificada
const DEFAULT_DAILY_MISSIONS = MISSIONS_BY_FOCUS_AREA.Mental;

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
        
        // Buscar área de foco atual do usuário
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const currentFocusArea = userData?.focusArea || 'Mental';
        
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
            
            return res.json({ missions, created: true, focusArea: currentFocusArea });
        }
        
        // Verificar se a área de foco mudou desde que as missões foram criadas
        // Se sim, verificar se há missões não completadas de outra categoria
        const existingMissions = [];
        let needsReset = false;
        let hasIncompleteMissionsFromOtherCategory = false;
        
        todayMissions.forEach(doc => {
            const mission = { id: doc.id, ...doc.data() };
            existingMissions.push(mission);
            
            // Se a missão é de uma categoria diferente da área de foco atual e não está completa
            if (mission.category && mission.category !== currentFocusArea && !mission.completed) {
                hasIncompleteMissionsFromOtherCategory = true;
            }
        });
        
        // Se há missões incompletas de outra categoria, recriar as missões do dia
        if (hasIncompleteMissionsFromOtherCategory) {
            console.log(`🔄 Área de foco mudou para ${currentFocusArea}. Recriando missões do dia...`);
            
            // Deletar missões incompletas de outras categorias
            const batch = firestore.batch();
            for (const mission of existingMissions) {
                if (mission.category !== currentFocusArea && !mission.completed) {
                    const missionRef = firestore
                        .collection('users')
                        .doc(userId)
                        .collection('missions')
                        .doc(mission.id);
                    batch.delete(missionRef);
                }
            }
            await batch.commit();
            
            // Criar novas missões para a área de foco atual
            await createUserDailyMissions(userId);
            
            // Buscar missões atualizadas
            const updatedMissions = await firestore
                .collection('users')
                .doc(userId)
                .collection('missions')
                .where('date', '==', today)
                .get();
            
            const missions = [];
            updatedMissions.forEach(doc => {
                missions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return res.json({ missions, created: false, focusAreaChanged: true, focusArea: currentFocusArea });
        }
        
        // Retornar missões existentes (todas são da área de foco correta ou já completadas)
        res.json({ missions: existingMissions, created: false, focusArea: currentFocusArea });
        
    } catch (error) {
        console.error('Erro ao buscar missões de hoje:', error);
        res.status(500).json({
            error: 'Erro ao buscar missões de hoje'
        });
    }
};

/**
 * Criar missões diárias para um usuário
 * As missões são baseadas na área de foco do usuário
 */
async function createUserDailyMissions(userId) {
    const today = getTodayDate();
    
    // Buscar área de foco do usuário
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const focusArea = userData?.focusArea || 'Mental';
    
    // Obter missões para a área de foco
    const missions = MISSIONS_BY_FOCUS_AREA[focusArea] || DEFAULT_DAILY_MISSIONS;
    
    const batch = firestore.batch();
    
    for (const mission of missions) {
        const missionRef = firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .doc();
        
        batch.set(missionRef, {
            ...mission,
            category: focusArea,
            completed: false,
            date: today,
            observation: null, // Campo de observação
            createdAt: serverTimestamp()
        });
    }
    
    await batch.commit();
    
    console.log(`✅ Missões de ${focusArea} criadas para usuário ${userId}`);
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
 * Dá XP (progresso/nível) e Moedas (para recompensas) separadamente
 */
exports.completeMission = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        const { observation } = req.body; // Campo de observação opcional
        
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
        
        // Marcar missão como concluída (com observação se fornecida)
        const updateData = {
            completed: true,
            completedAt: serverTimestamp()
        };
        
        // Adicionar observação se fornecida
        if (observation !== undefined && observation !== null) {
            updateData.observation = observation.trim();
        }
        
        batch.update(missionRef, updateData);
        
        // Buscar dados atuais do usuário
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        // Obter recompensa da ação (XP e Moedas)
        const reward = getActionReward('mission_completed');
        const xpEarned = missionData.xpEarned || reward.xp;
        const coinsEarned = missionData.coinsEarned || reward.coins;
        
        // XP atual e novo (para cálculo de level up)
        const currentXp = userData.xp || userData.totalPoints || 0;
        const newXp = currentXp + xpEarned;
        
        // Moedas atuais e novas
        const currentCoins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
        const newCoins = currentCoins + coinsEarned;
        
        // Atualizar XP e Moedas do usuário
        batch.update(userRef, {
            xp: increment(xpEarned),
            coins: increment(coinsEarned),
            totalPoints: increment(xpEarned) // Manter totalPoints = xp para compatibilidade
        });
        
        // Adicionar ao histórico de pontos
        const historyRef = firestore
            .collection('users')
            .doc(userId)
            .collection('pointsHistory')
            .doc();
        
        batch.set(historyRef, {
            reason: `Missão concluída: ${missionData.description}`,
            action: `Missão concluída: ${missionData.description}`,
            xp: xpEarned,
            coins: coinsEarned,
            points: xpEarned, // Compatibilidade
            type: 'mission_completed',
            observation: observation && observation.trim() ? observation.trim() : null,
            createdAt: serverTimestamp()
        });
        
        // Executar transação
        await batch.commit();
        
        // Verificar se subiu de nível (baseado em XP)
        const levelUp = checkLevelUp(currentXp, newXp);
        
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
            xpEarned,
            coinsEarned,
            pointsEarned: xpEarned, // Compatibilidade
            newXp,
            newCoins,
            newTotalPoints: newXp, // Compatibilidade
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

/**
 * Obter histórico de missões (rastreio de hábitos)
 * Retorna missões completadas organizadas por data
 */
exports.getMissionHistory = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { days = 30 } = req.query; // Padrão: últimos 30 dias
        
        // Calcular data de início
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Buscar todas as missões do período
        const missionsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .where('date', '>=', startDateStr)
            .orderBy('date', 'desc')
            .get();
        
        // Organizar por data
        const historyByDate = {};
        
        missionsSnapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date;
            
            if (!historyByDate[date]) {
                historyByDate[date] = {
                    date: date,
                    missions: [],
                    totalCompleted: 0,
                    totalMissions: 0
                };
            }
            
            historyByDate[date].missions.push({
                id: doc.id,
                description: data.description,
                category: data.category,
                icon: data.icon,
                completed: data.completed || false,
                observation: data.observation || null,
                pointsEarned: data.pointsEarned || 0,
                completedAt: data.completedAt ? data.completedAt.toDate() : null
            });
            
            historyByDate[date].totalMissions++;
            if (data.completed) {
                historyByDate[date].totalCompleted++;
            }
        });
        
        // Converter para array ordenado
        const history = Object.values(historyByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calcular estatísticas gerais
        let totalCompleted = 0;
        let totalMissions = 0;
        let daysWithFullCompletion = 0;
        
        history.forEach(day => {
            totalCompleted += day.totalCompleted;
            totalMissions += day.totalMissions;
            if (day.totalCompleted === day.totalMissions && day.totalMissions > 0) {
                daysWithFullCompletion++;
            }
        });
        
        res.json({
            success: true,
            history: history,
            stats: {
                totalDays: history.length,
                totalMissions: totalMissions,
                totalCompleted: totalCompleted,
                completionRate: totalMissions > 0 ? Math.round((totalCompleted / totalMissions) * 100) : 0,
                daysWithFullCompletion: daysWithFullCompletion,
                perfectDayRate: history.length > 0 ? Math.round((daysWithFullCompletion / history.length) * 100) : 0
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico de missões:', error);
        res.status(500).json({
            error: 'Erro ao buscar histórico de missões'
        });
    }
};

/**
 * Atualizar observação de uma missão
 */
exports.updateMissionObservation = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        const { observation } = req.body;
        
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
        
        await missionRef.update({
            observation: observation ? observation.trim() : null
        });
        
        res.json({
            success: true,
            message: 'Observação atualizada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar observação:', error);
        res.status(500).json({
            error: 'Erro ao atualizar observação'
        });
    }
};

// ===== MISSÕES RELÂMPAGO =====

/**
 * Obter missões relâmpago ativas (para usuários)
 */
exports.getFlashMissions = async (req, res) => {
    try {
        const userId = req.user.uid;
        const now = new Date();
        
        // Buscar missões relâmpago ativas (sem índice composto)
        // Filtrar apenas por active primeiro, depois filtrar expiresAt no código
        let flashMissionsSnapshot;
        try {
            flashMissionsSnapshot = await firestore
                .collection('flashMissions')
                .where('active', '==', true)
                .get();
        } catch (collectionError) {
            // Coleção pode não existir ainda
            console.log('Coleção flashMissions não existe ou está vazia');
            return res.json({
                success: true,
                flashMissions: []
            });
        }
        
        const flashMissions = [];
        
        for (const doc of flashMissionsSnapshot.docs) {
            const missionData = doc.data();
            
            // Verificar se não expirou (filtro manual para evitar índice composto)
            const expiresAt = missionData.expiresAt?.toDate ? missionData.expiresAt.toDate() : new Date(missionData.expiresAt);
            if (expiresAt <= now) {
                continue; // Pular missões expiradas
            }
            
            // Verificar se o usuário já resgatou esta missão
            const claimDoc = await firestore
                .collection('flashMissions')
                .doc(doc.id)
                .collection('claims')
                .doc(userId)
                .get();
            
            const alreadyClaimed = claimDoc.exists;
            
            flashMissions.push({
                id: doc.id,
                ...missionData,
                expiresAt: expiresAt,
                createdAt: missionData.createdAt?.toDate ? missionData.createdAt.toDate() : null,
                alreadyClaimed
            });
        }
        
        // Ordenar por expiresAt (mais próximo de expirar primeiro)
        flashMissions.sort((a, b) => a.expiresAt - b.expiresAt);
        
        res.json({
            success: true,
            flashMissions
        });
        
    } catch (error) {
        console.error('Erro ao buscar missões relâmpago:', error);
        res.status(500).json({
            error: 'Erro ao buscar missões relâmpago'
        });
    }
};

/**
 * Resgatar recompensa de missão relâmpago
 */
exports.claimFlashMission = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        
        // Buscar a missão relâmpago
        const flashMissionRef = firestore.collection('flashMissions').doc(id);
        const flashMissionDoc = await flashMissionRef.get();
        
        if (!flashMissionDoc.exists) {
            return res.status(404).json({
                error: 'Missão relâmpago não encontrada'
            });
        }
        
        const missionData = flashMissionDoc.data();
        const now = new Date();
        
        // Verificar se ainda está ativa
        if (!missionData.active || missionData.expiresAt.toDate() < now) {
            return res.status(400).json({
                error: 'Esta missão relâmpago expirou'
            });
        }
        
        // Verificar se já foi resgatada
        const claimRef = flashMissionRef.collection('claims').doc(userId);
        const claimDoc = await claimRef.get();
        
        if (claimDoc.exists) {
            return res.status(400).json({
                error: 'Você já resgatou esta missão relâmpago'
            });
        }
        
        // Buscar dados do usuário
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        const xpEarned = missionData.xp || 0;
        const coinsEarned = missionData.coins || 0;
        
        // Usar batch para operações atômicas
        const batch = firestore.batch();
        
        // Registrar claim
        batch.set(claimRef, {
            claimedAt: serverTimestamp(),
            xpEarned,
            coinsEarned
        });
        
        // Atualizar XP e moedas do usuário
        if (xpEarned > 0 || coinsEarned > 0) {
            const updates = {};
            if (xpEarned > 0) {
                updates.xp = increment(xpEarned);
                updates.totalPoints = increment(xpEarned);
            }
            if (coinsEarned > 0) {
                updates.coins = increment(coinsEarned);
            }
            batch.update(userRef, updates);
        }
        
        // Adicionar ao histórico de pontos
        const historyRef = firestore
            .collection('users')
            .doc(userId)
            .collection('pointsHistory')
            .doc();
        
        batch.set(historyRef, {
            reason: `⚡ Missão Relâmpago: ${missionData.title}`,
            action: `Missão Relâmpago: ${missionData.title}`,
            xp: xpEarned,
            coins: coinsEarned,
            points: xpEarned,
            type: 'flash_mission',
            flashMissionId: id,
            createdAt: serverTimestamp()
        });
        
        // Incrementar contador de claims na missão
        batch.update(flashMissionRef, {
            totalClaims: increment(1)
        });
        
        await batch.commit();
        
        // Calcular novos totais
        const currentXp = userData.xp || userData.totalPoints || 0;
        const currentCoins = userData.coins !== undefined ? userData.coins : currentXp;
        const newXp = currentXp + xpEarned;
        const newCoins = currentCoins + coinsEarned;
        
        // Verificar level up
        const levelUp = checkLevelUp(currentXp, newXp);
        
        console.log(`⚡ Missão relâmpago resgatada: ${missionData.title} por usuário ${userId}`);
        
        res.json({
            success: true,
            message: 'Recompensa resgatada com sucesso!',
            xpEarned,
            coinsEarned,
            newXp,
            newCoins,
            levelUp: levelUp ? {
                newLevel: levelUp.newLevel,
                levelName: levelUp.levelInfo.name
            } : null
        });
        
    } catch (error) {
        console.error('Erro ao resgatar missão relâmpago:', error);
        res.status(500).json({
            error: 'Erro ao resgatar missão relâmpago'
        });
    }
};

/**
 * Listar todas as missões relâmpago (admin)
 */
exports.getFlashMissionsAdmin = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acesso negado'
            });
        }
        
        let flashMissionsSnapshot;
        try {
            flashMissionsSnapshot = await firestore
                .collection('flashMissions')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
        } catch (collectionError) {
            // Coleção pode não existir ainda ou precisa de índice
            // Tentar sem orderBy
            try {
                flashMissionsSnapshot = await firestore
                    .collection('flashMissions')
                    .limit(50)
                    .get();
            } catch (e) {
                console.log('Coleção flashMissions não existe');
                return res.json({
                    success: true,
                    flashMissions: []
                });
            }
        }
        
        const flashMissions = [];
        
        flashMissionsSnapshot.forEach(doc => {
            const data = doc.data();
            flashMissions.push({
                id: doc.id,
                ...data,
                expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
            });
        });
        
        // Ordenar manualmente por createdAt
        flashMissions.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        
        res.json({
            success: true,
            flashMissions
        });
        
    } catch (error) {
        console.error('Erro ao buscar missões relâmpago (admin):', error);
        res.status(500).json({
            error: 'Erro ao buscar missões relâmpago'
        });
    }
};

/**
 * Criar missão relâmpago (admin only)
 */
exports.createFlashMission = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acesso negado'
            });
        }
        
        const { title, description, xp, coins, link, expiresInHours } = req.body;
        
        // Validações
        if (!title || !title.trim()) {
            return res.status(400).json({
                error: 'Título é obrigatório'
            });
        }
        
        if (!link || !link.trim()) {
            return res.status(400).json({
                error: 'Link é obrigatório'
            });
        }
        
        // Calcular data de expiração
        const hours = parseInt(expiresInHours) || 24;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + hours);
        
        const flashMissionData = {
            title: title.trim(),
            description: description?.trim() || '',
            xp: parseInt(xp) || 0,
            coins: parseInt(coins) || 0,
            link: link.trim(),
            active: true,
            totalClaims: 0,
            expiresAt: expiresAt,
            createdBy: req.user.uid,
            createdAt: serverTimestamp()
        };
        
        const docRef = await firestore.collection('flashMissions').add(flashMissionData);
        
        console.log(`⚡ Missão relâmpago criada: ${title} (ID: ${docRef.id})`);
        
        res.status(201).json({
            success: true,
            message: 'Missão relâmpago criada com sucesso!',
            flashMission: {
                id: docRef.id,
                ...flashMissionData,
                expiresAt: expiresAt
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar missão relâmpago:', error);
        res.status(500).json({
            error: 'Erro ao criar missão relâmpago'
        });
    }
};

/**
 * Atualizar missão relâmpago (admin only)
 */
exports.updateFlashMission = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acesso negado'
            });
        }
        
        const { id } = req.params;
        const { title, description, xp, coins, link, active, expiresInHours } = req.body;
        
        const flashMissionRef = firestore.collection('flashMissions').doc(id);
        const flashMissionDoc = await flashMissionRef.get();
        
        if (!flashMissionDoc.exists) {
            return res.status(404).json({
                error: 'Missão relâmpago não encontrada'
            });
        }
        
        const updates = {};
        
        if (title !== undefined) updates.title = title.trim();
        if (description !== undefined) updates.description = description.trim();
        if (xp !== undefined) updates.xp = parseInt(xp) || 0;
        if (coins !== undefined) updates.coins = parseInt(coins) || 0;
        if (link !== undefined) updates.link = link.trim();
        if (active !== undefined) updates.active = active;
        
        if (expiresInHours !== undefined) {
            const hours = parseInt(expiresInHours) || 24;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + hours);
            updates.expiresAt = expiresAt;
        }
        
        await flashMissionRef.update(updates);
        
        res.json({
            success: true,
            message: 'Missão relâmpago atualizada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar missão relâmpago:', error);
        res.status(500).json({
            error: 'Erro ao atualizar missão relâmpago'
        });
    }
};

/**
 * Deletar missão relâmpago (admin only)
 */
exports.deleteFlashMission = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acesso negado'
            });
        }
        
        const { id } = req.params;
        
        const flashMissionRef = firestore.collection('flashMissions').doc(id);
        const flashMissionDoc = await flashMissionRef.get();
        
        if (!flashMissionDoc.exists) {
            return res.status(404).json({
                error: 'Missão relâmpago não encontrada'
            });
        }
        
        // Deletar subcoleção de claims
        const claimsSnapshot = await flashMissionRef.collection('claims').get();
        const batch = firestore.batch();
        
        claimsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        batch.delete(flashMissionRef);
        
        await batch.commit();
        
        console.log(`⚡ Missão relâmpago deletada: ${id}`);
        
        res.json({
            success: true,
            message: 'Missão relâmpago deletada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao deletar missão relâmpago:', error);
        res.status(500).json({
            error: 'Erro ao deletar missão relâmpago'
        });
    }
};