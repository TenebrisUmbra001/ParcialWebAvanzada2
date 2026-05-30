import { z } from 'zod';

// Esquema de Auth
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('El email no tiene un formato válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
      .regex(/[0-9]/, 'La contraseña debe tener al menos un número')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('El email no tiene un formato válido'),
    password: z.string().min(1, 'La contraseña es obligatoria')
  })
});

// Esquema de Productos (Usado en POST y PUT)
export const productSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    sku: z.string().min(1, 'El SKU es obligatorio'),
    stock: z.number({ invalid_type_error: 'El stock debe ser un número' }).int().nonnegative('El stock no puede ser negativo'),
    minStock: z.number({ invalid_type_error: 'El stock mínimo debe ser un número' }).int().nonnegative('El stock mínimo no puede ser negativo'),
    price: z.number({ invalid_type_error: 'El precio debe ser un número' }).nonnegative('El precio no puede ser negativo'),
    categoryName: z.string().min(1, 'La categoría es obligatoria')
  })
});

// Esquema de Órdenes (Creación)
export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.number({ invalid_type_error: 'ID de producto inválido' }).int().positive('ID de producto debe ser positivo'),
        quantity: z.number({ invalid_type_error: 'La cantidad debe ser un número' }).int().positive('La cantidad debe ser mayor a 0')
      })
    ).min(1, 'La orden debe tener al menos un producto')
  })
});

// Esquema de Órdenes (Cambio de estado)
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DISPATCHED', 'CANCELLED'], { 
      errorMap: () => ({ message: 'Estado inválido. Solo se permite DISPATCHED o CANCELLED' }) 
    })
  })
});