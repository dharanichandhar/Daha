import { Router } from 'express';
import multer from 'multer';
import { cloudinary, configureCloudinary } from '../config/cloudinary.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/image', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!cloudinary) {
      return res.status(500).json({ error: 'Cloudinary not configured' });
    }

    const b64 = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(dataURI, {
        folder: 'daha-products',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
        ],
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    res.json({
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

router.delete('/image/:publicId', requireAdmin, async (req, res) => {
  try {
    if (!cloudinary) {
      return res.status(500).json({ error: 'Cloudinary not configured' });
    }

    const { publicId } = req.params;
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({ error: 'Image delete failed' });
  }
});

export default router;
