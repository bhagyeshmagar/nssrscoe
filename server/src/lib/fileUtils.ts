import fs from 'fs';
import path from 'path';

/**
 * Safely deletes a file from the uploads directory given its public URL.
 * Silently ignores ENOENT (file not found) but logs other errors.
 * Guards against path traversal by taking only the basename.
 */
export const deleteUploadedFile = async (fileUrl: string | null | undefined) => {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    const filename = path.basename(fileUrl);
    const filePath = path.join(__dirname, '../../uploads', filename);
    await fs.promises.unlink(filePath).catch((err) => {
        if (err.code !== 'ENOENT') {
            console.error('Failed to delete file:', filePath, err);
        }
    });
};
