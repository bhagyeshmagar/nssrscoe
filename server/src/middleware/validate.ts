import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { handleError } from '../lib/response';

export const validateRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            }) as any;
            if (validated.body !== undefined) req.body = validated.body;
            if (validated.query !== undefined) req.query = validated.query;
            if (validated.params !== undefined) req.params = validated.params;
            next();
        } catch (error) {
            handleError(res, error);
        }
    };
};
