const { firestore } = require('../config/firebase');

class DocumentController {
  // Listar documentos do usuário
  async listDocuments(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.query; // personal, criminalRecord, references

      let query = firestore.collection('user_documents').where('userId', '==', userId);
      
      if (type) {
        query = query.where('type', '==', type);
      }

      const snapshot = await query.get();
      
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar documentos'
      });
    }
  }

  // Adicionar documento
  async addDocument(req, res) {
    try {
      const userId = req.user.id;
      const { type, name, description, data } = req.body;

      // Validações
      if (!type || !['personal', 'criminalRecord', 'reference'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de documento inválido'
        });
      }

      if (!name || !data) {
        return res.status(400).json({
          success: false,
          message: 'Nome e dados do documento são obrigatórios'
        });
      }

      // Validar tamanho (700KB em Base64)
      const MAX_DOC_SIZE = 700 * 1024;
      const base64Data = data.split(',')[1] || '';
      const bufferLength = Buffer.from(base64Data, 'base64').length;

      if (bufferLength > MAX_DOC_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'Documento muito grande. Máximo 700KB.'
        });
      }

      const document = {
        userId,
        type,
        name,
        description: description || '',
        data,
        uploadedAt: new Date().toISOString()
      };

      const docRef = await firestore.collection('user_documents').add(document);

      res.json({
        success: true,
        data: {
          id: docRef.id,
          ...document
        },
        message: 'Documento adicionado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar documento'
      });
    }
  }

  // Obter documento específico
  async getDocument(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const docRef = firestore.collection('user_documents').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Documento não encontrado'
        });
      }

      const docData = doc.data();

      // Verificar se o documento pertence ao usuário
      if (docData.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      res.json({
        success: true,
        data: {
          id: doc.id,
          ...docData
        }
      });
    } catch (error) {
      console.error('Erro ao obter documento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter documento'
      });
    }
  }

  // Excluir documento
  async deleteDocument(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const docRef = firestore.collection('user_documents').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Documento não encontrado'
        });
      }

      const docData = doc.data();

      // Verificar se o documento pertence ao usuário
      if (docData.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      await docRef.delete();

      res.json({
        success: true,
        message: 'Documento excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir documento'
      });
    }
  }
}

module.exports = new DocumentController();

