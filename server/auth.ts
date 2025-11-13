import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    organizationId?: string;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  next();
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.organizationId) {
    console.log("Admin auth failed - session:", req.session);
    console.log("Admin auth failed - organizationId:", req.session?.organizationId);
    return res.status(401).json({ 
      message: "Admin authentication required",
      details: "Please login to the admin portal first"
    });
  }
  next();
}
