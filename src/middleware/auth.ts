import { auth } from "../config/auth";
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const withAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Standard way to pass headers to Better Auth in Node/Express
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as any),
    });

    if (!session) {
      (req as any).auth = { userId: null, session: null };
      return next();
    }

    (req as any).auth = { 
      userId: session.user.id,
      session: session.session,
      user: session.user
    };
    next();
  } catch (error) {
    console.error('DEBUG: Better Auth Session Verification Failed:', error);
    (req as any).auth = { userId: null, session: null };
    next();
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authState = (req as any).auth;
  
  if (!authState || !authState.userId) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or missing authentication session.' 
    });
  }
  next();
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).auth?.user;
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access denied: Admin authority required.' 
    });
  }
  next();
};
