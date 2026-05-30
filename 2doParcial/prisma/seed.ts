import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Usuarios
  const passAdmin = await bcrypt.hash('admin123', 10);
  const passOp = await bcrypt.hash('oper123', 10);

  await prisma.user.upsert({ where: { email: 'admin@inventareameesta.com' }, update: {}, create: { email: 'admin@inventareameesta.com', password: passAdmin, role: 'ADMIN' } });
  await prisma.user.upsert({ where: { email: 'oper@inventareameesta.com' }, update: {}, create: { email: 'oper@inventareameesta.com', password: passOp, role: 'OPERATOR' } });

  // Categorías
  const cat1 = await prisma.category.upsert({ where: { name: 'Electrónica' }, update: {}, create: { name: 'Electrónica' } });
  const cat2 = await prisma.category.upsert({ where: { name: 'Oficina' }, update: {}, create: { name: 'Oficina' } });

  // Productos (Quitado skipDuplicates porque SQLite no lo soporta)
  await prisma.product.createMany({ data: [
    { name: 'Mouse USB', sku: 'ELEC-001', stock: 10, minStock: 2, price: 15.5, categoryId: cat1.id },
    { name: 'Teclado Mecánico', sku: 'ELEC-002', stock: 3, minStock: 5, price: 45.0, categoryId: cat1.id }, // Bajo stock
    { name: 'Resma Papel A4', sku: 'OFI-001', stock: 50, minStock: 10, price: 5.0, categoryId: cat2.id },
  ]});

  console.log('Datos de prueba cargados');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });