import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { BlobServiceClient } from '@azure/storage-blob';

const router = Router();

// ── Storage backend ───────────────────────────────────────────────────────────
// In production (AZURE_STORAGE_CONNECTION_STRING set): stream directly to Azure Blob.
// In dev (env var absent): fall back to local disk so local dev needs no Azure account.

const uploadsDir = path.join(__dirname, '../../uploads');

const getBlobContainerClient = () => {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const container = process.env.AZURE_STORAGE_CONTAINER || 'nss-uploads';
    if (!connStr) return null;
    return BlobServiceClient.fromConnectionString(connStr).getContainerClient(container);
};

const containerClient = getBlobContainerClient();
const USE_AZURE = !!containerClient;

if (!USE_AZURE) {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('[upload] Azure Blob not configured — using local disk storage');
} else {
    console.log('[upload] Azure Blob storage enabled');
}

// Shared filename generator
const buildBlobName = (file: Express.Multer.File): string => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    return `${file.fieldname}-${uniqueSuffix}${ext}`;
};

// Azure Blob storage engine
const azureEngine: multer.StorageEngine = {
    _handleFile(_req: any, file: any, cb: any) {
        const blobName = buildBlobName(file);
        const blockBlobClient = containerClient!.getBlockBlobClient(blobName);
        blockBlobClient
            .uploadStream(file.stream, undefined, undefined, {
                blobHTTPHeaders: { blobContentType: file.mimetype },
            })
            .then(() => cb(null, { filename: blobName, url: blockBlobClient.url, size: 0 }))
            .catch(cb);
    },
    _removeFile(_req: any, file: any, cb: any) {
        containerClient!.deleteBlob(file.filename).then(() => cb(null)).catch(cb);
    },
};

// Local disk storage engine (dev fallback)
const diskEngine = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => cb(null, buildBlobName(file)),
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
    '.ppt':  'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls':  'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt':  'text/plain',
    '.csv':  'text/csv',
};

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const expectedMime = ALLOWED_TYPES[ext];
    if (expectedMime && file.mimetype === expectedMime) return cb(null, true);
    if (ext === '.jpg' && file.mimetype === 'image/jpg') return cb(null, true);
    cb(new Error('Only allowed file types are accepted (images, videos, documents).'));
};

const upload = multer({
    storage: USE_AZURE ? azureEngine : diskEngine,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 },
});

import rateLimit from 'express-rate-limit';

// Strict rate limiter for uploads — prevents DoS from bulk large file uploads
const uploadRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many file uploads. Please wait a few minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// All upload routes require authentication
router.use(authenticateToken);

// Upload single file
router.post('/single', uploadRateLimiter, (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            console.error('[upload] Error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 100 MB.' });
                }
                return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ success: false, message: err.message || 'Error uploading file.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        // Custom size enforcement: 10MB limit for non-videos
        const isVideo = req.file.mimetype.startsWith('video/');
        if (!isVideo && req.file.size > 10 * 1024 * 1024) {
            // Cleanup: Azure Blob or local disk
            if (USE_AZURE) {
                containerClient!.deleteBlob(req.file.filename).catch(e => console.error('Cleanup error', e));
            } else {
                fs.promises.unlink((req.file as any).path).catch(e => console.error('Cleanup error', e));
            }
            return res.status(400).json({ success: false, message: 'File too large. Maximum size for non-video files is 10 MB.' });
        }

        // URL: Azure returns an absolute https URL; local disk returns a relative /uploads/ path
        const url = USE_AZURE
            ? (req.file as any).url
            : `/uploads/${req.file.filename}`;

        return res.json({
            success: true,
            data: {
                url,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
            }
        });
    });
});

// Upload multiple files
router.post('/multiple', uploadRateLimiter, (req, res) => {
    upload.array('files', 10)(req, res, (err: any) => {
        if (err) {
            console.error('[upload] Error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 100 MB.' });
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

        const uploadedFiles = req.files as Express.Multer.File[];

        // Custom size enforcement: 10MB limit for non-videos
        const overLimitFiles = uploadedFiles.filter(f => !f.mimetype.startsWith('video/') && f.size > 10 * 1024 * 1024);
        if (overLimitFiles.length > 0) {
            if (USE_AZURE) {
                Promise.all(uploadedFiles.map(f => containerClient!.deleteBlob(f.filename).catch(e => console.error('Cleanup error', e))));
            } else {
                Promise.all(uploadedFiles.map(f => fs.promises.unlink((f as any).path).catch(e => console.error('Cleanup error', e))));
            }
            return res.status(400).json({ success: false, message: 'One or more files are too large. Maximum size for non-video files is 10 MB.' });
        }

        const files = uploadedFiles.map(file => ({
            url: USE_AZURE ? (file as any).url : `/uploads/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
        }));

        return res.json({ success: true, data: { files } });
    });
});

// Delete a file — sanitise filename to prevent path traversal
router.delete('/:filename', requireAdmin, async (req, res) => {
    const rawFilename = req.params.filename;
    const filename = path.basename(rawFilename);

    if (!filename || filename !== rawFilename || filename.startsWith('.')) {
        return res.status(400).json({ success: false, message: 'Invalid filename.' });
    }

    try {
        if (USE_AZURE) {
            await containerClient!.deleteBlob(filename);
        } else {
            const filePath = path.join(uploadsDir, filename);
            if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
                return res.status(400).json({ success: false, message: 'Invalid filename.' });
            }
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'File not found.' });
            }
            await fs.promises.unlink(filePath);
        }
        return res.json({ success: true, message: 'File deleted successfully.' });
    } catch (err) {
        console.error('[upload] Delete error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete file.' });
    }
});

export default router;
