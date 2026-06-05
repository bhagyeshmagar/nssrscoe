import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { handleError } from '../lib/response';

export const validateRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError || error?.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors || error.issues,
                });
            }
            handleError(res, error);
        }
    };
};
