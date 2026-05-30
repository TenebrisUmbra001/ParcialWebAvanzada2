import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middlewares/auth';
import { orderService } from '../services/order.service';
import { validate } from '../middlewares/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas';
import { AppError } from '../utils/errors';

const router = Router();

router.use(authMiddleware); // Una sola vez

router.post('/', validate(createOrderSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('No autenticado', 401); // Consistencia: Usar AppError y next
    const order = await orderService.create(req.user.id, req.body.items);
    res.status(201).json(order);
  } catch (error) { next(error); }
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getAll();
    res.json(orders);
  } catch (error) { next(error); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getById(Number(req.params.id));
    res.json(order);
  } catch (error) { next(error); }
});

// Ruta PATCH con validación Zod
router.patch('/:id/status', validate(updateOrderStatusSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await orderService.updateStatus(Number(req.params.id), req.body.status);
    res.json(result);
  } catch (error) { next(error); }
});

export default router;