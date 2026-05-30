import express from 'express';
import path from 'path';
import { prisma } from './config/prisma';
import { AppError } from './utils/errors';
import authRoutes from './routes/auth';          // Corregido
import productRoutes from './routes/product';    // Corregido
import orderRoutes from './routes/order';        // Corregido

const app = express();
const PORT = 3000;

app.use(express.json());
// Configurar carpeta pública
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, async () => {
  await prisma.$connect();
  console.log(`Servidor de InventareameESTA corriendo en http://localhost:${PORT}`);
});