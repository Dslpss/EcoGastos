const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Determine updates directory: use env var or default to local public/updates
const updatesDir = process.env.STORAGE_PATH 
  ? path.resolve(process.env.STORAGE_PATH)
  : path.join(__dirname, '../../public/updates');

// Ensure updates directory exists
if (!fs.existsSync(updatesDir)) {
  fs.mkdirSync(updatesDir, { recursive: true });
}

console.log(`[Updates] Storing files in: ${updatesDir}`);

// Configure multer for APK storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, updatesDir);
  },
  filename: function (req, file, cb) {
    // Sanitize filename to avoid issues
    cb(null, file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});

// Filter to accept only .apk
const fileFilter = (req, file, cb) => {
  if (file.originalname.endsWith('.apk')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos .apk são permitidos!'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter 
});

// Route to upload APK (Admin only)
router.post('/upload', upload.single('apk'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }

    const { version, notes } = req.body;
    
    // Save metadata about this version
    const metadata = {
      version: version || 'unknown',
      notes: notes || '',
      fileName: req.file.filename,
      uploadDate: new Date().toISOString(),
      size: req.file.size
    };

    // Write metadata to a json file
    fs.writeFileSync(
      path.join(updatesDir, 'latest.json'), 
      JSON.stringify(metadata, null, 2)
    );

    res.json({
      success: true,
      message: 'Upload realizado com sucesso!',
      data: metadata
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Erro ao fazer upload.' });
  }
});

// Route to get latest version info
router.get('/latest', (req, res) => {
  try {
    const metadataPath = path.join(updatesDir, 'latest.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Construct download URL pointing to our download route
      const downloadUrl = `${req.protocol}://${req.get('host')}/api/updates/download/${metadata.fileName}`;
      
      res.json({
        success: true,
        ...metadata,
        downloadUrl
      });
    } else {
      res.status(404).json({ success: false, message: 'Nenhuma versão encontrada.' });
    }
  } catch (error) {
    console.error('Get latest error:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar atualização.' });
  }
});

// Route to download specific APK
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(updatesDir, filename);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(updatesDir)) {
    return res.status(403).json({ success: false, message: 'Acesso negado.' });
  }

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Arquivo não encontrado.' });
  }
});

module.exports = router;

