const User = require('../models/User');

// Obter perfil do usuário atual
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Remover senha
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter perfil'
    });
  }
};

// Atualizar perfil do usuário
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    console.log('📥 [Backend] Recebendo atualização de perfil para usuário:', userId);
    console.log('📋 [Backend] Dados recebidos:', JSON.stringify(updateData, null, 2));

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id;
    delete updateData.email; // Email não pode ser alterado por enquanto
    delete updateData.password; // Senha deve ter endpoint específico
    delete updateData.createdAt;
    delete updateData.verified;

    console.log('📝 [Backend] Dados após limpeza:', JSON.stringify(updateData, null, 2));

    // Atualizar usuário
    const updatedUser = await User.update(userId, updateData);

    console.log('✅ [Backend] Usuário atualizado com sucesso');
    console.log('📤 [Backend] Dados atualizados:', JSON.stringify(updatedUser, null, 2));

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: updatedUser
    });
  } catch (error) {
    console.error('❌ [Backend] Erro ao atualizar perfil:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao atualizar perfil'
    });
  }
};

// Deletar conta do usuário
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await User.delete(userId);

    res.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar conta'
    });
  }
};

// Listar profissionais (cuidadores e enfermeiros)
exports.listProfessionals = async (req, res) => {
  try {
    const { userType, specialties, minRating, maxRate } = req.query;
    
    // Buscar profissionais
    let professionals = await User.findAll({
      userType: userType || undefined,
      verified: true
    });

    // Filtrar apenas cuidadores e enfermeiros
    professionals = professionals.filter(user => 
      user.userType === 'caregiver' || user.userType === 'nurse'
    );

    // Aplicar filtros adicionais
    if (specialties) {
      const specialtiesArray = specialties.split(',');
      professionals = professionals.filter(user => 
        user.professional?.specialties?.some(s => specialtiesArray.includes(s))
      );
    }

    if (minRating) {
      professionals = professionals.filter(user => 
        user.professional?.rating >= parseFloat(minRating)
      );
    }

    if (maxRate) {
      professionals = professionals.filter(user => 
        user.professional?.hourlyRate <= parseFloat(maxRate)
      );
    }

    res.json({
      success: true,
      data: professionals,
      total: professionals.length
    });
  } catch (error) {
    console.error('Erro ao listar profissionais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar profissionais'
    });
  }
};

// Obter detalhes de um profissional
exports.getProfessionalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await User.findById(id);

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Profissional não encontrado'
      });
    }

    // Verificar se é um profissional
    if (professional.userType !== 'caregiver' && professional.userType !== 'nurse') {
      return res.status(400).json({
        success: false,
        message: 'Usuário não é um profissional'
      });
    }

    // Remover senha
    const { password, ...professionalWithoutPassword } = professional;

    res.json({
      success: true,
      data: professionalWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do profissional:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do profissional'
    });
  }
};

// Listar todos os usuários (Admin apenas)
exports.listAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Erro ao listar todos os usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários'
    });
  }
};

// Obter usuário por ID (Admin apenas)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Remover senha
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter usuário'
    });
  }
};

// Atualizar qualquer usuário por ID (Admin apenas)
exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Admin pode atualizar qualquer campo
    const updatedUser = await User.update(id, updateData);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao atualizar usuário'
    });
  }
};

// Deletar usuário por ID (Admin apenas)
exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    await User.delete(id);

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar usuário'
    });
  }
};
