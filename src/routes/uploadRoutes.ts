import { Router } from 'express';
import { upload } from '../config/cloudinary';

const router = Router();

// Endpoint for single image upload
router.post('/image', upload.single('image'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({ 
      success: true, 
      imageUrl: req.file.path, 
      publicId: req.file.filename 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for generic file upload
router.post('/file', upload.single('file'), (req: any, res: any) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
