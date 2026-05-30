import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middlewares/auth';
import { AppError } from '../utils/errors';

export const authService = {
  register: async (email: string, password: string) => {
    if (!email || !password || password.length < 6) throw new AppError('Email y contraseña (min 6 chars) requeridos', 400);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('El email ya está registrado', 400);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashedPassword } });
    const token = generateToken(user.id, user.role);
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  },
  login: async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Credenciales inválidas', 401);
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Credenciales inválidas', 401);
    
    const token = generateToken(user.id, user.role);
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }
};