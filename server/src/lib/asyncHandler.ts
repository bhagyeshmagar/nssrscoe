import { Request, Response } from 'express';
import { handleError } from './response';

export const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response) => {
        Promise.resolve(fn(req, res)).catch((err) => handleError(res, err));
    };
