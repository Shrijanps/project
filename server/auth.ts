import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'real_estate_jwt_secret_token_2026';
const PASSWORD_SALT = 'estate_secure_salt_2026';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`${PASSWORD_SALT}${password}`).digest('hex');
}

export function generateToken(user: Omit<User, 'password_hash'>): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
    } catch {
      // Ignore optional auth error
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
  }
  next();
}
