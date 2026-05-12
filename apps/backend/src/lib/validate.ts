import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export function validate<T>({
  body,
  query,
  params,
}: {
  body?: ZodType<T>;
  query?: ZodType<any>;
  params?: ZodType<any>;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (body) req.body = body.parse(req.body);
    if (query) req.query = query.parse(req.query);
    if (params) req.params = params.parse(req.params);
    next();
  };
}

