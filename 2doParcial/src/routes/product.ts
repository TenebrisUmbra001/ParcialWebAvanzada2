import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware, roleGuard } from '../middlewares/auth';
import { productService } from '../services/product.service';
import { validate } from '../middlewares/validate';
import { productSchema } from '../schemas';

const router = Router();

router.use(authMiddleware); // Solo un authMiddleware por archivo

router.post('/', roleGuard(['ADMIN']), validate(productSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (error) { next(error); }
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const products = await productService.getAll(categoryId);
    res.json(products);
  } catch (error) { next(error); }
});

router.put('/:id', roleGuard(['ADMIN']), validate(productSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await productService.update(Number(req.params.id), req.body);
    res.json(product);
  } catch (error) { next(error); }
});

router.delete('/:id', roleGuard(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await productService.delete(Number(req.params.id));
    res.json({ message: 'Producto eliminado' });
  } catch (error) { next(error); }
});

router.get('/low-stock', roleGuard(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await productService.getLowStock();
    res.json(products);
  } catch (error) { next(error); }
});

export default router;