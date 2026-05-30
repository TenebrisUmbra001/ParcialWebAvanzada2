import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

// 1. Definimos la interfaz de lo que esperamos recibir (TypeScript estricto)
interface ProductInput {
  name?: string;
  sku?: string;
  stock?: number | string | null;
  minStock?: number | string | null;
  price?: number | string | null;
  categoryName?: string;
}

export const productService = {
  create: async (data: ProductInput) => {
    const { name, sku, price, stock, minStock, categoryName } = data;

    // 2. Validar que los strings existan
    if (!name || !sku || !categoryName) {
      throw new AppError('Nombre, SKU y Categoría son obligatorios', 400);
    }

    // 3. Rechazar explícitamente valores nulos o vacíos antes de convertirlos
    if (price === null || price === undefined || price === '') throw new AppError('El precio es obligatorio', 400);
    if (stock === null || stock === undefined || stock === '') throw new AppError('El stock es obligatorio', 400);
    if (minStock === null || minStock === undefined || minStock === '') throw new AppError('El stock mínimo es obligatorio', 400);

    // 4. Convertir a números
    const numPrice = Number(price);
    const numStock = Number(stock);
    const numMinStock = Number(minStock);

    // 5. Rechazar si no son números válidos (ej. si escribieron texto)
    if (isNaN(numPrice) || isNaN(numStock) || isNaN(numMinStock)) {
      throw new AppError('Precio, Stock y Stock Mínimo deben ser números válidos', 400);
    }

    // 6. Validar que no sean negativos
    if (numStock < 0 || numMinStock < 0 || numPrice < 0) {
      throw new AppError('El stock, stock mínimo y precio no pueden ser negativos', 400);
    }

    // 7. VERIFICAR SKU ÚNICO: Prevenir el error 500 de la base de datos
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      throw new AppError('Ya existe un producto con ese SKU', 400);
    }

    // 8. Pasar a Prisma solo datos limpios y tipados
    return prisma.product.create({
      data: {
        name,
        sku,
        price: numPrice,
        stock: numStock,
        minStock: numMinStock,
        category: {
          connectOrCreate: {
            where: { name: categoryName },
            create: { name: categoryName }
          }
        }
      },
      include: { category: true }
    });
  },

  getAll: async (categoryId?: number) => {
    const filter: { categoryId?: number } = {};
    if (categoryId) filter.categoryId = Number(categoryId);
    return prisma.product.findMany({ where: filter, include: { category: true } });
  },

  update: async (id: number, data: ProductInput) => {
    await prisma.product.findUniqueOrThrow({ where: { id } }).catch(() => { 
      throw new AppError('Producto no encontrado', 404); 
    });

    const { name, sku, price, stock, minStock, categoryName } = data;
    
    // Construimos el objeto de actualización limpio
    const updateData: { 
      name?: string; 
      sku?: string; 
      price?: number; 
      stock?: number; 
      minStock?: number; 
      category?: any 
    } = {};

    if (name) updateData.name = name;
    
    if (sku) {
      // Si actualizan el SKU, verificar que el nuevo no exista
      const existingSku = await prisma.product.findFirst({ where: { sku, NOT: { id } } });
      if (existingSku) throw new AppError('Ya existe otro producto con ese SKU', 400);
      updateData.sku = sku;
    }

    if (price !== undefined && price !== null) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) throw new AppError('Precio inválido o negativo', 400);
      updateData.price = numPrice;
    }

    if (stock !== undefined && stock !== null) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0) throw new AppError('Stock inválido o negativo', 400);
      updateData.stock = numStock;
    }

    if (minStock !== undefined && minStock !== null) {
      const numMinStock = Number(minStock);
      if (isNaN(numMinStock) || numMinStock < 0) throw new AppError('Stock mínimo inválido o negativo', 400);
      updateData.minStock = numMinStock;
    }

    if (categoryName) {
      updateData.category = {
        connectOrCreate: {
          where: { name: categoryName },
          create: { name: categoryName }
        }
      };
    }

    return prisma.product.update({ 
      where: { id }, 
      data: updateData, 
      include: { category: true } 
    });
  },

  delete: async (id: number) => {
    await prisma.product.findUniqueOrThrow({ where: { id } }).catch(() => { 
      throw new AppError('Producto no encontrado', 404); 
    });
    return prisma.product.delete({ where: { id } });
  },

  getLowStock: async () => {
    const products = await prisma.product.findMany({ include: { category: true } });
    return products.filter((p: { stock: number; minStock: number }) => p.stock <= p.minStock);
  }
};