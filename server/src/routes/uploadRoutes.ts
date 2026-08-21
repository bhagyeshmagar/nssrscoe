import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        // Use only the field name + timestamp + random — never the original name (path traversal prevention)
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// Allowed extension → MIME pairs (both must match)
const ALLOWED_TYPES: Record<string, string> = {
    '.jpeg': 'image/jpeg',
    '.jpg':  'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.mp4':  'video/mp4',
    '.webm': 'video/webm',
    '.mov':  'video/quicktime',
    '.avi':  'video/x-msvideo',
    '.pdf':  'application/pdf',
    '.doc':  'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const expectedMime = ALLOWED_TYPES[ext];

    // Both extension AND MIME type must be valid and consistent
    if (expectedMime && file.mimetype === expectedMime) {
        return cb(null, true);
    }
    // Allow image/jpg as alias for image/jpeg
    if (ext === '.jpg' && file.mimetype === 'image/jpg') {
        return cb(null, true);
    }
    cb(new Error('Only allowed file types are accepted (images, videos, PDF, DOCX).'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// All upload routes require authentication
router.use(authenticateToken);

// Upload single file
router.post('/single', (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            console.error('[upload] Error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 50 MB.' });
                }
                return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ success: false, message: err.message || 'Error uploading file.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        return res.json({
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
        });
    });
});

// Upload multiple files
router.post('/multiple', (req, res) => {
    upload.array('files', 10)(req, res, (err: any) => {
        if (err) {
            console.error('[upload] Error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 50 MB.' });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({ success: false, message: 'Too many files. Maximum is 10 files per request.' });
                }
                return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ success: false, message: err.message || 'Error uploading files.' });
        }

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded.' });
        }

        const files = (req.files as Express.Multer.File[]).map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
        }));

        return res.json({ files });
    });
});

// Delete a file — sanitise filename to prevent path traversal
router.delete('/:filename', requireAdmin, async (req, res) => {
    // Strip any directory components — only allow plain filenames
    const rawFilename = req.params.filename;
    const filename = path.basename(rawFilename);

    // Reject if the sanitised name differs (indicates traversal attempt) or is empty
    if (!filename || filename !== rawFilename || filename.startsWith('.')) {
        return res.status(400).json({ success: false, message: 'Invalid filename.' });
    }

    const filePath = path.join(uploadsDir, filename);

    // Double-check the resolved path is still inside uploadsDir
    if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
        return res.status(400).json({ success: false, message: 'Invalid filename.' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found.' });
    }

    try {
        await fs.promises.unlink(filePath);
        return res.json({ success: true, message: 'File deleted successfully.' });
    } catch (err) {
        console.error('[upload] Delete error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete file.' });
    }
});

export default router;
