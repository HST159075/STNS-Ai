import { Router } from 'express';
import { upload } from '../config/cloudinary';

const router = Router();

// Endpoint for single image upload
router.post('/image', (req, res, next) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({ 
      success: true, 
      imageUrl: req.file.path, 
      publicId: req.file.filename 
    });
  });
});

// Endpoint for generic file upload
router.post('/file', (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({ 
      success: true, 
      fileUrl: req.file.path, 
      publicId: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype
    });
  });
});

export default router;
