import { prisma, Prisma } from '../config/prisma'; // Importamos Prisma para los tipos
import { AppError } from '../utils/errors';

// Tipos explícitos para no usar 'any'
interface OrderItemInput {
    productId: number;
    quantity: number;
}

interface ProductInTx {
    id: number;
    name: string;
    price: number;
    stock: number;
}

export const orderService = {
    create: async (operatorId: number, items: OrderItemInput[]) => {
        if (!items || items.length === 0) throw new AppError('La orden debe tener productos', 400);

        // Validar cantidades positivas
        for (const item of items) {
            if (item.quantity <= 0) throw new AppError('Las cantidades deben ser mayores a 0', 400);
        }

        // TRANSACCIÓN: Tipamos el cliente transaccional (tx)
        const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Verificar stock para TODOS los productos
            const productIds = items.map(i => i.productId);
            const products = await tx.product.findMany({ where: { id: { in: productIds } } });

            if (products.length !== items.length) throw new AppError('Uno o más productos no existen', 404);

            // 2. Validar y preparar descuento de stock
            for (const item of items) {
                // Tipamos el producto encontrado para evitar el '!'
                const product = products.find((p: ProductInTx) => p.id === item.productId);
                if (!product) throw new AppError('Producto no encontrado en la lista', 404);
                
                if (product.stock < item.quantity) {
                    throw new AppError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`, 400);
                }
            }

            // 3. Descontar stock
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }

            // 4. Crear la orden
            const totalOrderItems = items.map(item => {
                const product = products.find((p: ProductInTx) => p.id === item.productId);
                if (!product) throw new AppError('Error interno al calcular precio', 500);
                
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtOrder: product.price
                };
            });

            const newOrder = await tx.order.create({
                data: {
                    operatorId,
                    items: { create: totalOrderItems }
                },
                include: { items: { include: { product: true } }, operator: true }
            });

            return newOrder;
        });

        return order;
    },

    getAll: async () => {
        return prisma.order.findMany({
            include: { 
                items: { include: { product: true } }, 
                operator: true 
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    getById: async (id: number) => {
        const order = await prisma.order.findUnique({ 
            where: { id }, 
            include: { items: { include: { product: true } }, operator: true } 
        });
        if (!order) throw new AppError('Orden no encontrada', 404);
        return order;
    },

       updateStatus: async (id: number, status: string) => {
        const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
        if (!order) throw new AppError('Orden no encontrada', 404);

        // Validación estricta de transiciones de estado
        if (order.status === 'CANCELLED') {
            throw new AppError('Una orden CANCELADA no puede cambiar de estado', 400);
        }
        if (order.status === 'DISPATCHED') {
            throw new AppError('Una orden DESPACHADA no puede cambiar de estado', 400);
        }
        if (order.status !== 'PENDING') {
            throw new AppError('Solo se pueden modificar órdenes PENDING', 400);
        }

        if (!['DISPATCHED', 'CANCELLED'].includes(status)) {
            throw new AppError('Estado inválido. Solo se permite DISPATCHED o CANCELLED', 400);
        }

        if (status === 'CANCELLED') {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
                await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
            });
            return { message: 'Orden cancelada y stock restaurado' };
        }

        return prisma.order.update({ 
            where: { id }, 
            data: { status: 'DISPATCHED' }, 
            include: { items: true } 
        });
    }
};