import { Router, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas'; // Apuntando a ../schemas
import { AuthRequest } from '../middlewares/auth';



const router = Router();

router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body.email, req.body.password);
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.status(200).json(result);
  } catch (error) { next(error); }
});

export default router;