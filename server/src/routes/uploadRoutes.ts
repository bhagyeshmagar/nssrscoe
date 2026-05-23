import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter for images, videos, and documents (PDFs, DOCX)
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed extensions
    const allowedExtensions = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi|pdf|docx|doc/;
    // Allowed MIME types
    const allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimes.includes(file.mimetype);

    if (extname || mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images, videos, and documents (PDF, DOCX) are allowed!'));
    }
};


const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload single file
router.post('/single', (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            console.error('Upload error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
                }
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ message: err.message || 'Error uploading file' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    });
});


// Upload multiple files
router.post('/multiple', upload.array('files', 10), (req, res) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
    }));

    res.json({ files });
});

// Delete a file
router.delete('/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ message: 'File deleted successfully' });
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

export default router;
