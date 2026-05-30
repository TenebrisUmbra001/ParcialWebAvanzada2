import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Unir todos los errores de Zod en un solo mensaje legible
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ');
        return next(new AppError(message, 400));
      }
      next(error);
    }
  };
};