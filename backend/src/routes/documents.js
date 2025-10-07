const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  uploadDocument,
  getPatientDocuments,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');

router.post('/patients/:patientId/documents', authMiddleware, uploadDocument);
router.get('/patients/:patientId/documents', authMiddleware, getPatientDocuments);
router.get('/documents/:documentId/download', authMiddleware, downloadDocument);
router.delete('/documents/:documentId', authMiddleware, deleteDocument);

module.exports = router;
