import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { ApiError } from "./errors";

export type JwtPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
  }
  const sub = (decoded as any).sub;
  const email = (decoded as any).email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
  }
  return { sub, email };
}

export type AuthedRequest = Request & { user: JwtPayload };

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing Authorization header");
  }
  const token = header.slice("Bearer ".length);
  const payload = verifyAccessToken(token);
  (req as AuthedRequest).user = payload;
  next();
}

