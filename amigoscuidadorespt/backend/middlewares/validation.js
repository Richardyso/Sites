const { body, validationResult } = require('express-validator');

// Middleware para processar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Validação para registro
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
,
  
  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/\d/).withMessage('Senha deve conter pelo menos um número'),
  
  body('userType')
    .notEmpty().withMessage('Tipo de usuário é obrigatório')
    .isIn(['client', 'caregiver', 'nurse', 'admin']).withMessage('Tipo de usuário inválido'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Telefone inválido'),
  
  // Validações específicas para profissionais
  body('experience')
    .if(body('userType').isIn(['caregiver', 'nurse']))
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Experiência deve ter no máximo 500 caracteres'),
  
  body('specialties')
    .if(body('userType').isIn(['caregiver', 'nurse']))
    .optional()
    .isArray().withMessage('Especialidades devem ser um array'),
  
  body('hourlyRate')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Taxa horária deve ser um número positivo'),
  
  handleValidationErrors
];

// Validação para login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
,
  
  body('password')
    .notEmpty().withMessage('Senha é obrigatória'),
  
  handleValidationErrors
];

// Validação para atualização de perfil
exports.validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Telefone inválido'),
  
  body('address')
    .optional()
    .isObject().withMessage('Endereço deve ser um objeto'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Rua deve ter no máximo 200 caracteres'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Cidade deve ter no máximo 100 caracteres'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Estado deve ter no máximo 50 caracteres'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{3}$/).withMessage('CEP deve estar no formato XXXX-XXX'),
  
  // Validações para profissionais
  body('professional.experience')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Experiência deve ter no máximo 500 caracteres'),
  
  body('professional.specialties')
    .optional()
    .isArray().withMessage('Especialidades devem ser um array'),
  
  body('professional.certifications')
    .optional()
    .isArray().withMessage('Certificações devem ser um array'),

  body('professional.availability')
    .optional()
    .isObject().withMessage('Disponibilidade deve ser um objeto'),

  body('professional.availability.slots')
    .optional()
    .isArray().withMessage('Os horários devem ser um array'),

  body('professional.availability.slots.*.day')
    .optional()
    .notEmpty().withMessage('Dia da disponibilidade é obrigatório'),

  body('professional.availability.slots.*.start')
    .optional()
    .notEmpty().withMessage('Horário de início é obrigatório'),

  body('professional.availability.slots.*.end')
    .optional()
    .notEmpty().withMessage('Horário de término é obrigatório'),
  
  body('professional.hourlyRate')
    .optional()
    .isFloat({ min: 0 }).withMessage('Taxa horária deve ser um número positivo'),
  
  body('professional.bio')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Biografia deve ter no máximo 1000 caracteres'),
  
  handleValidationErrors
];

// Validação para mudança de senha (se implementar)
exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Senha atual é obrigatória'),
  
  body('newPassword')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
    .matches(/\d/).withMessage('Nova senha deve conter pelo menos um número')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('Nova senha deve ser diferente da senha atual'),
  
  handleValidationErrors
];
