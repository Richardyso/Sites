// Serverless function para Vercel
// Importa o app Express do backend e o exporta para o Vercel

try {
  const app = require('../backend/server');
  
  // Exportar para Vercel serverless
  module.exports = app;
} catch (error) {
  console.error('Erro ao carregar backend/server.js:', error);
  
  // Exportar função de erro como fallback
  module.exports = (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Erro ao inicializar servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };
}

