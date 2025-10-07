const pool = require('../models/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const isDemoMode = process.env.DEMO_MODE === 'true';

const uploadDir = path.join(__dirname, '../../uploads/patient_documents');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fsSync = require('fs');
    if (!fsSync.existsSync(uploadDir)) {
      fsSync.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('الملف غير مدعوم. الرجاء رفع ملفات من نوع: PDF, Word, صور، أو نص.'));
    }
  }
}).single('document');

const uploadDocument = (req, res) => {
  if (isDemoMode) {
    return res.status(403).json({ error: 'رفع المستندات غير متاح في وضع الديمو' });
  }

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم اختيار ملف' });
    }

    const client = await pool.connect();
    try {
      const { patientId } = req.params;
      const { notes } = req.body;

      const result = await client.query(
        `INSERT INTO patient_documents (patient_id, file_name, original_name, file_path, file_type, file_size, uploaded_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          patientId,
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          req.user.id,
          notes || null
        ]
      );

      res.status(201).json({
        message: 'تم رفع المستند بنجاح',
        document: result.rows[0]
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      console.error(error);
      res.status(500).json({ error: 'خطأ في رفع المستند' });
    } finally {
      client.release();
    }
  });
};

const getPatientDocuments = async (req, res) => {
  if (isDemoMode) {
    return res.json([]);
  }

  const client = await pool.connect();
  try {
    const { patientId } = req.params;

    const result = await client.query(
      `SELECT pd.*, u.full_name as uploaded_by_name
       FROM patient_documents pd
       LEFT JOIN users u ON pd.uploaded_by = u.id
       WHERE pd.patient_id = $1
       ORDER BY pd.created_at DESC`,
      [patientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في جلب المستندات' });
  } finally {
    client.release();
  }
};

const downloadDocument = async (req, res) => {
  if (isDemoMode) {
    return res.status(403).json({ error: 'تحميل المستندات غير متاح في وضع الديمو' });
  }

  const client = await pool.connect();
  try {
    const { documentId } = req.params;

    const result = await client.query(
      'SELECT * FROM patient_documents WHERE id = $1',
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المستند غير موجود' });
    }

    const document = result.rows[0];
    const filePath = path.join(uploadDir, document.file_name);

    res.download(filePath, document.original_name);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في تحميل المستند' });
  } finally {
    client.release();
  }
};

const deleteDocument = async (req, res) => {
  if (isDemoMode) {
    return res.status(403).json({ error: 'حذف المستندات غير متاح في وضع الديمو' });
  }

  const client = await pool.connect();
  try {
    const { documentId } = req.params;

    const result = await client.query(
      'SELECT * FROM patient_documents WHERE id = $1',
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المستند غير موجود' });
    }

    const document = result.rows[0];

    await client.query('DELETE FROM patient_documents WHERE id = $1', [documentId]);

    const filePath = path.join(uploadDir, document.file_name);
    await fs.unlink(filePath).catch(console.error);

    res.json({ message: 'تم حذف المستند بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في حذف المستند' });
  } finally {
    client.release();
  }
};

module.exports = {
  uploadDocument,
  getPatientDocuments,
  downloadDocument,
  deleteDocument
};
