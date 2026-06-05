import { Request, Response, NextFunction } from 'express';
import { handleError } from '../lib/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    handleError(res, err);
};
