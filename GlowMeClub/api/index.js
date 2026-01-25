// ===== API ENTRY POINT PARA VERCEL =====
// Este arquivo serve como ponto de entrada para Serverless Functions na Vercel

const app = require('../backend/server');

// Exportar como handler para Vercel Serverless
module.exports = (req, res) => {
    // O Express app pode ser usado como handler
    return app(req, res);
};
